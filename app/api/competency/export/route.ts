import { auth } from '@/app/(auth)/auth';
import { getCompetencyTasksByUserId, getAllCompetencyCodes } from '@/lib/db/queries';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

// Define custom types for XLSX workbook extensions
interface CustomWorkbookSheet extends XLSX.WorkSheet {
  Drawing?: {
    vml: Array<{
      shape: {
        type: string;
        style: string;
        opacity: string;
        imagedata: {
          src: string;
        };
      };
    }>;
  };
}

interface CustomWorkbook extends Omit<XLSX.WorkBook, 'Sheets'> {
  Sheets: { [sheet: string]: CustomWorkbookSheet };
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all tasks and competency codes
    const [tasks, competencyCodes] = await Promise.all([
      getCompetencyTasksByUserId(session.user.id),
      getAllCompetencyCodes()
    ]);

    // Create headers for all competency codes
    const competencyHeaders = competencyCodes.reduce((acc: { [key: string]: number }, code) => {
      acc[code.id] = 0;
      return acc;
    }, {});

    // Prepare data for Excel
    const excelData = tasks.map(task => {
      // Reset competency markers for each task
      const competencyMarkers = { ...competencyHeaders };
      
      // Mark competencies that are present in this task
      task.competencies.forEach(comp => {
        competencyMarkers[comp.code.id] = 1;
      });

      return {
        Date: new Date(task.createdAt).toLocaleDateString('en-GB'),
        'Task Title': task.title,
        'Task Description': task.description,
        ...competencyMarkers
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new() as unknown as CustomWorkbook;
    const ws = XLSX.utils.json_to_sheet(excelData) as CustomWorkbookSheet;

    // Customize column widths
    const colWidths = {
      A: 12, // Date
      B: 20, // Task Title
      C: 50, // Task Description
    };

    ws['!cols'] = Object.entries(colWidths).map(([_, width]) => ({ wch: width }));

    // Replace 1s and 0s with 'X' and empty strings
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = 3; C <= range.e.c; ++C) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell) {
          ws[XLSX.utils.encode_cell({ r: R, c: C })] = {
            t: 's',
            v: cell.v === 1 ? 'X' : ''
          };
        }
      }
    }

    // Add logo watermark using VML
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logoweb.png');
    const logoBuffer = await fs.readFile(logoPath);
    const logoBase64 = logoBuffer.toString('base64');

    ws.Drawing = {
      'vml': [
        {
          'shape': {
            'type': '#_x0000_t75',
            'style': 'position:absolute;margin-left:200pt;margin-top:150pt;width:100pt;height:100pt;z-index:-1',
            'opacity': '0.3',
            'imagedata': {
              'src': `data:image/png;base64,${logoBase64}`
            }
          }
        }
      ]
    };

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Competency Log');

    // Generate buffer with additional options for watermark support
    const buf = XLSX.write(wb as XLSX.WorkBook, {
      type: 'buffer',
      bookType: 'xlsx',
      bookSST: false,
      compression: true,
      Props: {
        Title: 'Competency Log',
        Subject: 'Mini Mentor Export',
        Author: 'Mini Mentor'
      }
    });

    // Format current date for filename
    const today = new Date();
    const dateString = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');

    // Return the Excel file with date in filename
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="competency-log-${dateString}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error exporting competency log:', error);
    return NextResponse.json(
      { error: 'Failed to export competency log' },
      { status: 500 }
    );
  }
} 