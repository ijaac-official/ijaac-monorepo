export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#0d2b4e;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.5px;">IJAAC Journal</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px;color:#0d2b4e;font-size:20px;">${title}</h2>
                <div style="color:#333333;font-size:14px;line-height:1.6;">${bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#f0f1f3;color:#8a8f98;font-size:12px;">
                This is an automated message from the IJAAC editorial system. Please do not reply directly to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
