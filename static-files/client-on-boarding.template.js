/**
 * Config
 * */
const config = require('./../config');
module.exports = ({ linkedInSignUpLink, firstName, lastName }) => {
    return (mailTemplate = `<html>
<head>
  <meta charset='utf-8'/>
  <meta name='viewport' content='width=device-width, initial-scale=1'/>
  <link rel='preconnect' href='https://fonts.gstatic.com'>
  <link href='https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap' rel='stylesheet'>
  <style>
    body {
      margin: 0;
    }
    body * {
      font-family: 'Roboto', sans-serif !important;
    }
  </style>
</head>
<body>
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-collapse:collapse">
  <tbody>
  <tr>
    <td valign="top" align="center" style="margin: 0 auto;">
      <table cellspacing='0' cellpadding='0'
             style="max-width: 600px; border-collapse:collapse; background-color: white;">
        <tr>
          <td align='left' valign='top'>
            <img style='width: 100%'
                 src='${config.backEndBaseUrl}mail-images/linkfluencer-header.jpg'/>
          </td>
        </tr>

        <tr>
          <td align='left' valign='center'
              style='padding: 10px 3%; font-size: 13px; line-height: 1.2; font-weight: 400;  color: #222222'>
            Congrats on signing up to Jayla.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center'
              style='padding: 10px 3%; font-size: 13px; line-height: 1.2; font-weight: 400;  color: #222222'>
            You now have access to your own personal sales assistant, how good is that? 🙂
          </td>
        </tr>

        <tr>
          <td align='left' valign='center'
              style='padding: 10px 3%; font-size: 13px; line-height: 1.2; font-weight: 400;  color: #222222'>
            To get started, it's <a href="${linkedInSignUpLink}" target="_blank"
                                    style="text-decoration:none; font-weight: 500; color: #4590E4;">
            extremely important that you follow this link
          </a> and complete all the steps on the getting started page.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center'
              style='padding: 10px 3%; font-size: 13px; line-height: 1.2; font-weight: 400;  color: #222222'>
            Once you've done everything you're ready to go.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center'
              style='padding: 10px 3%; font-size: 13px; line-height: 1.2; font-weight: 400;  color: #222222'>
            Might also be worth starring this email or bookmarking the page so it's easy to find.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center'
              style='padding: 10px 3%; font-size: 13px; line-height: 1.2; font-weight: 400;  color: #222222'>
            After that, anytime you want to use Jayla make sure you're:
          </td>
        </tr>

        <tr>
          <td align='left' valign='center'
              style='padding: 0 5% 10px 8%; font-size: 13px; line-height: 1.2; font-weight: 400;  color: #222222'>
            1. Using Google chrome<br/>
            2. Logged in to the extension<br/>
            3. Signed into your LinkedIn account
          </td>
        </tr>
        <tr>
          <td align='left' valign='center'
              style='padding: 10px 3%; font-size: 13px; line-height: 1.2; font-weight: 400;  color: #222222'>
            Best of Luck, we’re always here if you need us.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center'
              style='padding: 10px 3% 30px 3%; font-size: 13px; line-height: 1.2; font-weight: 400;  color: #222222'>
            Team linkfluencer®
          </td>
        </tr>

        <tr>
          <td align='center' valign='center'>
            <table
                    style="width:100%; font-size: 13px; line-height: 1.5; color: #FFFFFF; background-color: #4590E4; padding: 30pt 5% 20pt;"
            >
              <tr>
                <td align='center' valign='center'
                    style='font-size: 16px; font-weight: 500'>
                  Get the Latest News
                </td>
              </tr>

              <tr>
                <td align='center' valign='center'>
                  <table>
                    <tr>
                      <td align='center' valign='center' style='width: 360px; font-size: 14px; line-height: 1.1; color: #fff'>
                        Follow our blogs for all the recent updates, features and strategies on
                        LinkedIn.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr><td style="height: 2px">
              </td></tr>

              <tr>
                <td align='center' valign='center'>
                  <table style="background: #469a1e;color: #fff;padding: 7px 40px;border-radius: 3rem;">
                    <tr>
                      <td valign="center" align="center" style="font-weight: 700">
                        <a href="https://linkfluencer.com/blog" target="_blank" style="font-family: 'Roboto',sans-serif;font-size: 14px;color:#fff;font-weight:700;display: inline-block;text-decoration: none;text-transform: uppercase;font-weight: 700;">
                                                    READ MORE
                                                </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <tr>
          <td align="center">
            <table cellspacing="5" style="padding: 20px 0 15px 0">
              <tr>
                                <td><a href="https://www.facebook.com/au.linkfluencer/" target="_blank" style="text-decoration: none; cursor:pointer;">
                                    <img height="33"
                                         src='${config.backEndBaseUrl}mail-images/facebook.png'/></a>
                                </td>
                                <td><a href="https://www.linkedin.com/company/linkfluencer-pty-ltd/" target="_blank" style="text-decoration: none; cursor:pointer;">
                                    <img height="33"
                                         src='${config.backEndBaseUrl}mail-images/linkedin.png'/></a>
                                </td>
                                <td><a href="https://www.youtube.com/channel/UC8ff9YC96plcIo47biGcYSg" target="_blank" style="text-decoration: none; cursor:pointer;">
                                    <img height="33"
                                         src='${config.backEndBaseUrl}mail-images/youtube.png'/></a>
                                </td>
                            </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align='center' valign='center'
              style='padding-bottom: 5%; line-height: 1.2; color: rgb(153,153,153); font-size: 11px'>
            linkfluencer Pty Ltd © 2021 All rights reserved.
          </td>
        </tr>

      </table>
    </td>
  </tr>
  </tbody>
</table>
</body>
</html>
`);
};
