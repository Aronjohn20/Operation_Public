import { jsPDF } from "jspdf";
import { RSET_LOGO_BASE64, CSI_LOGO_BASE64 } from "./logosBase64";

/**
 * Format date helpers
 */
export function formatFullDateWithDay(dateStr: string): string {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);

      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      const daySuffix = (d: number) => {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
          case 1: return "st";
          case 2: return "nd";
          case 3: return "rd";
          default: return "th";
        }
      };

      const dayOfWeek = daysOfWeek[date.getDay()];
      const monthName = months[date.getMonth()];
      return `${day}${daySuffix(day)} ${monthName} ${year} (${dayOfWeek})`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatShortSlashDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Direct 1-Click Word (.doc) Downloader
 * Note: Uses HTML + Office Word XML envelope so MS Word opens it natively
 * and treats embedded images as full editable pictures.
 */
export function exportToWord(filename: string, title: string, htmlBody: string) {
  const fileContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'>
    <title>${title}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page {
        size: 8.27in 11.69in; /* A4 */
        margin: 1.0in 1.0in 1.0in 1.0in;
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000000;
      }
      p { margin: 0 0 10pt 0; }
      h2, h3 { font-family: 'Times New Roman', Times, serif; color: #000000; }
      table { border-collapse: collapse; width: 100%; margin-top: 12pt; }
      th, td { border: 1px solid #000000; padding: 6pt 8pt; font-size: 11pt; text-align: left; }
      th { font-weight: bold; background-color: #f5f5f5; }
      a { color: #0000EE; text-decoration: underline; }
      img { display: inline-block; }
    </style>
  </head>
  <body>
    ${htmlBody}
  </body>
  </html>`;

  const blob = new Blob(["\ufeff", fileContent], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, "_")}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * -------------------------------------------------------------
 * 1. ATTENDANCE SHEET EXPORTERS (With Institutional & CSI Logos)
 * -------------------------------------------------------------
 */
export function exportAttendancePdf(
  filename: string,
  eventTitle: string,
  eventDate: string,
  venue: string,
  coordinators: string[],
  attendees?: { name: string; gender?: string; class_batch?: string }[]
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Add RSET Logo top-left
  try {
    doc.addImage(RSET_LOGO_BASE64, "PNG", margin, 10, 18, 25.5);
  } catch (e) {
    console.warn("Could not render RSET logo on PDF", e);
  }

  // Add CSI Logo top-right
  try {
    doc.addImage(CSI_LOGO_BASE64, "PNG", pageWidth - margin - 22, 11, 22, 22);
  } catch (e) {
    console.warn("Could not render CSI logo on PDF", e);
  }

  // Header Titles (Centered between logos)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("COMPUTER SOCIETY OF INDIA STUDENT BRANCH", pageWidth / 2, 19, { align: "center" });

  doc.setFontSize(12);
  doc.text("ATTENDANCE SHEET", pageWidth / 2, 27, { align: "center" });

  // Metadata block
  doc.setFontSize(10);
  const metaY = 42;
  const col1X = margin;
  const col2X = margin + 45;

  doc.setFont("helvetica", "bold");
  doc.text("EVENT NAME", col1X, metaY);
  doc.text(`: ${eventTitle.toUpperCase()}`, col2X, metaY);

  doc.text("DATE", col1X, metaY + 6);
  doc.text(`: ${formatShortSlashDate(eventDate)}`, col2X, metaY + 6);

  doc.text("VENUE", col1X, metaY + 12);
  doc.text(`: ${venue}`, col2X, metaY + 12);

  doc.text("COORDINATORS", col1X, metaY + 18);
  doc.text(`: ${coordinators.join(", ") || "Club Coordinators"}`, col2X, metaY + 18);

  const participantCountText = attendees && attendees.length > 0 ? String(attendees.length) : "__________________";
  doc.text("No. of participants", col1X, metaY + 24);
  doc.text(`: ${participantCountText}`, col2X, metaY + 24);

  // Table Structure
  const tableY = metaY + 31;
  const colWidths = [18, 56, 32, 32, 44]; // Total = 182mm (Page width 210 - 28 margin)
  const colHeaders = ["SL NO", "NAME", "GENDER", "CLASS", "SIGNATURE"];
  const rowHeight = 8.5;

  const drawTableHeader = (yPos: number) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    let curX = margin;
    doc.rect(margin, yPos, 182, 8);
    colHeaders.forEach((header, idx) => {
      if (idx === 0) {
        doc.text(header, curX + colWidths[idx] / 2, yPos + 5.5, { align: "center" });
      } else if (idx === 1) {
        doc.text(header, curX + 4, yPos + 5.5);
      } else {
        doc.text(header, curX + colWidths[idx] / 2, yPos + 5.5, { align: "center" });
      }
      curX += colWidths[idx];
      if (idx < colHeaders.length - 1) {
        doc.line(curX, yPos, curX, yPos + 8);
      }
    });
  };

  drawTableHeader(tableY);

  let curY = tableY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  const totalRows = attendees && attendees.length > 0 ? attendees.length : 20;

  for (let r = 1; r <= totalRows; r++) {
    if (curY + rowHeight > pageHeight - margin) {
      doc.addPage();
      curY = margin;
      drawTableHeader(curY);
      curY += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
    }

    const att = attendees && attendees[r - 1];
    doc.rect(margin, curY, 182, rowHeight);
    let cellX = margin;

    // Sl No centered
    doc.text(String(r), cellX + colWidths[0] / 2, curY + 5.5, { align: "center" });
    cellX += colWidths[0];
    doc.line(cellX, curY, cellX, curY + rowHeight);

    // Name column
    if (att?.name) {
      doc.text(att.name.slice(0, 32), cellX + 3, curY + 5.5);
    }
    cellX += colWidths[1];
    doc.line(cellX, curY, cellX, curY + rowHeight);

    // Gender column
    if (att?.gender) {
      doc.text(att.gender, cellX + colWidths[2] / 2, curY + 5.5, { align: "center" });
    }
    cellX += colWidths[2];
    doc.line(cellX, curY, cellX, curY + rowHeight);

    // Class column
    if (att?.class_batch) {
      doc.text(att.class_batch, cellX + colWidths[3] / 2, curY + 5.5, { align: "center" });
    }
    cellX += colWidths[3];
    doc.line(cellX, curY, cellX, curY + rowHeight);

    // Signature column
    cellX += colWidths[4];

    curY += rowHeight;
  }

  doc.save(`${filename.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
}

export function exportAttendanceWord(
  filename: string,
  eventTitle: string,
  eventDate: string,
  venue: string,
  coordinators: string[],
  attendees?: { name: string; gender?: string; class_batch?: string }[]
) {
  let tableRows = "";
  const totalRows = attendees && attendees.length > 0 ? attendees.length : 20;

  for (let i = 1; i <= totalRows; i++) {
    const att = attendees && attendees[i - 1];
    tableRows += `
      <tr>
        <td style="text-align: center; width: 10%; height: 26px;">${i}</td>
        <td style="width: 34%; padding-left: 6px;">${att ? att.name : "&nbsp;"}</td>
        <td style="width: 16%; text-align: center;">${att?.gender || "&nbsp;"}</td>
        <td style="width: 16%; text-align: center;">${att?.class_batch || "&nbsp;"}</td>
        <td style="width: 24%;">&nbsp;</td>
      </tr>
    `;
  }

  const participantCountText = attendees && attendees.length > 0 ? String(attendees.length) : "__________________";

  const html = `
    <!-- Top Header Table with Editable Logos -->
    <table style="width: 100%; border: none; margin-bottom: 24px; font-family: Calibri, 'Segoe UI', Arial, sans-serif;">
      <tr style="border: none;">
        <td style="width: 20%; border: none; vertical-align: middle; text-align: left;">
          <img src="${RSET_LOGO_BASE64}" width="65" height="92" alt="Institute Logo" style="display: inline-block;" />
        </td>
        <td style="width: 60%; border: none; vertical-align: middle; text-align: center;">
          <h3 style="margin: 0; font-family: Calibri, sans-serif; font-size: 13.5pt; font-weight: bold; text-transform: uppercase;">COMPUTER SOCIETY OF INDIA STUDENT BRANCH</h3>
          <p style="margin: 8px 0 0 0; font-family: Calibri, sans-serif; font-size: 12.5pt; font-weight: bold; letter-spacing: 0.5px;">ATTENDANCE SHEET</p>
        </td>
        <td style="width: 20%; border: none; vertical-align: middle; text-align: right;">
          <img src="${CSI_LOGO_BASE64}" width="75" height="75" alt="CSI Logo" style="display: inline-block;" />
        </td>
      </tr>
    </table>

    <!-- Metadata Block -->
    <table style="width: 100%; border: none; margin-top: 6pt; margin-bottom: 12pt; border-collapse: collapse; font-family: Calibri, 'Segoe UI', Arial, sans-serif;">
      <tr style="border: none;">
        <td style="width: 220px; border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">EVENT NAME</td>
        <td style="border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">: ${eventTitle.toUpperCase()}</td>
      </tr>
      <tr style="border: none;">
        <td style="width: 220px; border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">DATE</td>
        <td style="border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">: ${formatShortSlashDate(eventDate)}</td>
      </tr>
      <tr style="border: none;">
        <td style="width: 220px; border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">VENUE</td>
        <td style="border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">: ${venue}</td>
      </tr>
      <tr style="border: none;">
        <td style="width: 220px; border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">COORDINATORS</td>
        <td style="border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">: ${coordinators.join(", ") || "Club Coordinators"}</td>
      </tr>
      <tr style="border: none;">
        <td style="width: 220px; border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">No. of participants</td>
        <td style="border: none; font-weight: bold; padding: 1.5pt 0; font-size: 13pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: Calibri, sans-serif;">: ${participantCountText}</td>
      </tr>
    </table>

    <!-- Attendance Table -->
    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-family: Calibri, 'Segoe UI', Arial, sans-serif;">
      <thead>
        <tr style="background-color: #ffffff;">
          <th style="width: 10%; border: 1px solid #000; text-align: center; padding: 7px 4px; font-size: 10.5pt;">SL NO</th>
          <th style="width: 34%; border: 1px solid #000; text-align: left; padding: 7px 8px; font-size: 10.5pt;">NAME</th>
          <th style="width: 16%; border: 1px solid #000; text-align: center; padding: 7px 4px; font-size: 10.5pt;">GENDER</th>
          <th style="width: 16%; border: 1px solid #000; text-align: center; padding: 7px 4px; font-size: 10.5pt;">CLASS</th>
          <th style="width: 24%; border: 1px solid #000; text-align: center; padding: 7px 6px; font-size: 10.5pt;">SIGNATURE</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;

  exportToWord(filename, `Attendance_${eventTitle}`, html);
}

/**
 * -------------------------------------------------------------
 * 2. RSMS NOTICE EXPORTERS (Strictly No Color, No Logos, Blue Link Only)
 * -------------------------------------------------------------
 */
export function exportRsmsPdf(
  filename: string,
  eventName: string,
  eventDateFormatted: string,
  timeFormatted: string,
  platformOrVenue: string,
  venueLabel: string,
  descriptionText: string,
  coordinatorsList: string[],
  facultyCoordinator: string,
  bitlyUrl: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  let y = 25;

  // Title: Underlined and bold (pure black)
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(eventName, margin, y);

  const titleWidth = doc.getTextWidth(eventName);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 1.2, margin + titleWidth, y + 1.2);

  y += 12;

  // Intro Paragraph
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const introLines = doc.splitTextToSize(descriptionText, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 5.5 + 4;

  // Date, Time, Platform (Bold label, normal value)
  doc.setFont("times", "bold");
  doc.text("Date: ", margin, y);
  const dateLabelWidth = doc.getTextWidth("Date: ");
  doc.setFont("times", "normal");
  doc.text(eventDateFormatted, margin + dateLabelWidth, y);
  y += 5.5;

  doc.setFont("times", "bold");
  doc.text("Time: ", margin, y);
  const timeLabelWidth = doc.getTextWidth("Time: ");
  doc.setFont("times", "normal");
  doc.text(timeFormatted, margin + timeLabelWidth, y);
  y += 5.5;

  doc.setFont("times", "bold");
  doc.text(`${venueLabel}: `, margin, y);
  const platLabelWidth = doc.getTextWidth(`${venueLabel}: `);
  doc.setFont("times", "normal");
  doc.text(platformOrVenue, margin + platLabelWidth, y);
  y += 10;

  // Student Coordinators
  doc.setFont("times", "normal");
  doc.text("Student Coordinators:", margin, y);
  y += 7;

  coordinatorsList.forEach((c) => {
    doc.text(c, margin, y);
    y += 7;
  });

  y += 3;

  // Faculty Coordinator
  doc.setFont("times", "normal");
  doc.text(`Faculty Coordinator: ${facultyCoordinator}`, margin, y);
  y += 10;

  // Registration Link (Only clickable part is blue)
  doc.setFont("times", "normal");
  doc.text("Registration Link: ", margin, y);
  const regLabelWidth = doc.getTextWidth("Registration Link: ");

  doc.setTextColor(37, 99, 235); // Blue link color
  doc.textWithLink(bitlyUrl, margin + regLabelWidth, y, { url: bitlyUrl });

  const linkWidth = doc.getTextWidth(bitlyUrl);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.2);
  doc.line(margin + regLabelWidth, y + 0.8, margin + regLabelWidth + linkWidth, y + 0.8);

  doc.save(`${filename.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
}

export function exportRsmsWord(
  filename: string,
  eventName: string,
  eventDateFormatted: string,
  timeFormatted: string,
  platformOrVenue: string,
  venueLabel: string,
  descriptionText: string,
  coordinatorsList: string[],
  facultyCoordinator: string,
  bitlyUrl: string
) {
  const coordinatorsHtml = coordinatorsList
    .map((c) => `<p style="margin: 0 0 10pt 0;">${c}</p>`)
    .join("");

  const html = `
    <p style="margin: 0 0 14pt 0;"><u><strong style="font-size: 13.5pt;">${eventName}</strong></u></p>

    <p style="margin: 0 0 14pt 0; text-align: justify;">${descriptionText}</p>

    <p style="margin: 0 0 4pt 0;"><strong>Date: ${eventDateFormatted}</strong></p>
    <p style="margin: 0 0 4pt 0;"><strong>Time: ${timeFormatted}</strong></p>
    <p style="margin: 0 0 14pt 0;"><strong>${venueLabel}: ${platformOrVenue}</strong></p>

    <p style="margin: 0 0 8pt 0;">Student Coordinators:</p>
    ${coordinatorsHtml}

    <p style="margin: 12pt 0 12pt 0;">Faculty Coordinator: ${facultyCoordinator}</p>

    <p style="margin: 0 0 10pt 0;">Registration Link: <a href="${bitlyUrl}" style="color: #0000EE; text-decoration: underline;">${bitlyUrl}</a></p>
  `;

  exportToWord(filename, `RSMS_Notice_${eventName}`, html);
}

/**
 * -------------------------------------------------------------
 * 3. PERMISSION LETTER EXPORTERS (Strict Formal Structure, No Logos)
 * -------------------------------------------------------------
 */
export function exportPermissionPdf(
  filename: string,
  eventName: string,
  eventDateFormatted: string,
  timeFormatted: string,
  venue: string,
  briefDescription: string = "",
  targetBranchesString: string = "eligible",
  facultyCoordinator: string = "Faculty Coordinator"
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  let y = 25;

  // Header To
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  doc.text("To", margin, y); y += 5.5;
  doc.text("The Principal,", margin, y); y += 5.5;
  doc.text("College of Engineering & Technology,", margin, y); y += 5.5;
  doc.text("University Campus.", margin, y); y += 10;

  // Subject
  doc.setFont("times", "bold");
  const subjectText = `Subject: Request for Conducting Technical Event "${eventName}"`;
  doc.text(subjectText, margin, y);
  y += 9;

  // Salutation
  doc.setFont("times", "normal");
  doc.text("Respected Sir,", margin, y);
  y += 7;

  // Body Paragraph 1
  const p1Text = `The Technical Student Society is planning to organize a technical event titled ${eventName}. ${briefDescription || "The event is designed to introduce participants to core Computer Science concepts such as problem solving, logic, and analytical thinking through interactive challenges."}`;
  const p1Lines = doc.splitTextToSize(p1Text, contentWidth);
  doc.text(p1Lines, margin, y);
  y += p1Lines.length * 5.2 + 5;

  // Body Paragraph 2 (Departments & Venue)
  const p2Text = `The event is open to students from the ${targetBranchesString} departments and will be conducted in the ${venue} using a software-based platform developed by the Technical Student Society.`;
  const p2Lines = doc.splitTextToSize(p2Text, contentWidth);
  doc.text(p2Lines, margin, y);
  y += p2Lines.length * 5.2 + 5;

  // Request line
  const p3Text = "We kindly request your permission to conduct this event as per the details given below:";
  doc.text(p3Text, margin, y);
  y += 7;

  // Event Details Block
  doc.setFont("times", "bold");
  doc.text(`Event: ${eventName}`, margin, y); y += 5.2;
  doc.text(`Date: ${eventDateFormatted}`, margin, y); y += 5.2;
  doc.text(`Time: ${timeFormatted}`, margin, y); y += 5.2;
  doc.text(`Venue: ${venue}`, margin, y); y += 8;

  // Hope line
  doc.setFont("times", "normal");
  const p4Text = "We hope for your kind support and approval for the successful conduct of the event.";
  doc.text(p4Text, margin, y);
  y += 10;

  // Sign off
  doc.text("Yours faithfully,", margin, y);
  y += 14;

  doc.setFont("times", "bold");
  doc.text(facultyCoordinator, margin, y); y += 5.2;
  doc.setFont("times", "normal");
  doc.text("Faculty Coordinator", margin, y); y += 5.2;
  doc.text("Technical Student Society", margin, y);

  doc.save(`${filename.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
}

export function exportPermissionWord(
  filename: string,
  eventName: string,
  eventDateFormatted: string,
  timeFormatted: string,
  venue: string,
  briefDescription: string = "",
  targetBranchesString: string = "eligible",
  facultyCoordinator: string = "Faculty Coordinator"
) {
  const html = `
    <p style="margin: 0 0 3pt 0;">To</p>
    <p style="margin: 0 0 3pt 0;">The Principal,</p>
    <p style="margin: 0 0 3pt 0;">College of Engineering & Technology,</p>
    <p style="margin: 0 0 14pt 0;">University Campus.</p>

    <p style="margin: 0 0 12pt 0;"><strong>Subject: Request for Conducting Technical Event "${eventName}"</strong></p>

    <p style="margin: 0 0 10pt 0;">Respected Sir,</p>

    <p style="margin: 0 0 12pt 0; text-align: justify;">
      The Technical Student Society is planning to organize a technical event titled <strong>${eventName}</strong>. ${briefDescription || "The event is designed to introduce participants to core Computer Science concepts such as problem solving, logic, and analytical thinking through interactive challenges."}
    </p>

    <p style="margin: 0 0 12pt 0; text-align: justify;">
      The event is open to students from the <strong>${targetBranchesString}</strong> departments and will be conducted in the <strong>${venue}</strong> using a software-based platform developed by the Technical Student Society.
    </p>

    <p style="margin: 0 0 8pt 0;">We kindly request your permission to conduct this event as per the details given below:</p>

    <p style="margin: 0 0 3pt 0;"><strong>Event:</strong> ${eventName}</p>
    <p style="margin: 0 0 3pt 0;"><strong>Date:</strong> ${eventDateFormatted}</p>
    <p style="margin: 0 0 3pt 0;"><strong>Time:</strong> ${timeFormatted}</p>
    <p style="margin: 0 0 12pt 0;"><strong>Venue:</strong> ${venue}</p>

    <p style="margin: 0 0 14pt 0;">We hope for your kind support and approval for the successful conduct of the event.</p>

    <p style="margin: 0 0 18pt 0;">Yours faithfully,</p>

    <p style="margin: 0 0 2pt 0;"><strong>${facultyCoordinator}</strong></p>
    <p style="margin: 0 0 2pt 0;">Faculty Coordinator</p>
    <p style="margin: 0 0 0 0;">Technical Student Society</p>
  `;

  exportToWord(filename, `Permission_Letter_${eventName}`, html);
}
