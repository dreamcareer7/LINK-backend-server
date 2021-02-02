/**
 * Config
 * */
const config = require('./../config');
module.exports = ({ firstName, lastName, setPasswordLink }) => {
    return (mailTemplate = `<html>
<head>
  <meta charset='utf-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1' />
  <link rel='preconnect' href='https://fonts.gstatic.com'>
  <link href='https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap' rel='stylesheet'>
  <style>
      body * {
          font-family: 'Roboto', sans-serif !important;
      }
  </style>
</head>
<body style='background-color: #F3F3F5'>
<div
  style='width: 100%; height: 100%;
 box-sizing: border-box;'
>
  <table style='width: 100%; height: 100%'>
    <tr>
      <td align='center' valign='center'>
        <div style='height: 100%; width: 100%;'>
          <div style='background-color: white; width: 740px; overflow: auto'>
            <table
              style='width: 100%;'
              cellspacing='0'
              cellpadding='0'
            >

              <tr>
                <td align='left' valign='top' style="height: 300px; background-size: 100% 100%; background-image: url('${
                    config.backEndBaseUrl
                }mail-images/link-bg.png')">
                    <img style='margin: 30px 0 0 40px; height: 30px' src='${
                        config.backEndBaseUrl
                    }mail-images/link-logo.png'/>
                </td>
              </tr>

              <tr>
                <td align='left' valign='center' style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400; color: #666666'>
                    Hey ${firstName ? firstName : ''} ${lastName ? lastName : ''},
                </td>
              </tr>

              <tr>
                <td align='left' valign='center' style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400;  color: #666666'>
                  You've been invited to be admin of Jayla.
                </td>
              </tr>

              <tr>
                <td align='left' valign='center' style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400;  color: #666666'>
                  To get started, it's <a href="${setPasswordLink}" style="font-weight: 500; color: #4590E4; text-decoration: none">extremely important
                  that you follow this link</a> and action the instructions and setup your admin account.
                </td>
              </tr>

              <tr>
                <td align='left' valign='center' style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400;  color: #666666'>
                  This is special link for you so do not share with anyone else.
                </td>
              </tr>

              <tr>
                <td align='left' valign='center' style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400;  color: #666666'>
                 Please setup 2FA on your account once you have access to the platform for security purposes.
                </td>
              </tr>

              <tr>
                <td align='left' valign='center' style='padding: 10px 40px 30px 40px; font-size: 14px; line-height: 24px; font-weight: 400;  color: #666666'>
                  Team linkfluencer®
                </td>
              </tr>

              <tr>
                <td align='center' valign='center'>
                  <table width="90%"
                    style='padding: 40px 40px 30px 40px; margin: 0 40px; font-size: 14px; line-height: 24px; color: #FFFFFF; background-color: #4590E4; border-radius: 14px'
                  >
                    <tr>
                      <td align='center' valign='center' style='padding-bottom:10px; font-size: 24px; font-weight: 500'>
                        Get the Latest News
                      </td>
                    </tr>

                    <tr>
                      <td align='center' valign='center' style='font-size: 14px;'>
                        <div style="width: 70%">
                          Follow our blogs for all the recent updates, features and strategies on LinkedIn.
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td valign="center" align="center">
                        <button
                                style='width: 150px; margin: 10px 0; padding: 7px 10px; background-color: #469A20; border-radius: 20px; border: none; outline: none'>
                          <a href="https://linkfluencer.com/blog" style="font-size: 14px; font-weight: 400; color: #FFFFFF; text-decoration: none"> READ MORE</a>
                        </button>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>

              <tr>
                <td align='center' valign='center'>
                  <a href="https://www.facebook.com/au.linkfluencer/" style="text-decoration: none"><img style='width: 40px; margin: 20px 2px' src='${
                      config.backEndBaseUrl
                  }mail-images/facebook.png' /></a>
                  <a href="https://www.linkedin.com/company/linkfluencer-pty-ltd/" style="text-decoration: none"><img style='width: 40px; margin: 20px 2px' src='${
                      config.backEndBaseUrl
                  }mail-images/linkedin.png' /></a>
                  <a href="https://www.youtube.com/channel/UC8ff9YC96plcIo47biGcYSg" style="text-decoration: none"><img style='width: 40px; margin: 20px 2px' src='${
                      config.backEndBaseUrl
                  }mail-images/youtube.png' /></a>
</td>
              </tr>

<!--              <tr>-->
<!--                <td align='center' valign='center' style='font-size: 14px; color: #666666'>-->
<!--                  <a href='https://www.facebook.com/nunacompanion' target='_blank'-->
<!--                     style='display:block; margin: 10px 0; color: #666666; font-weight: 500'>-->
<!--                    Unsubscribe-->
<!--                  </a>-->
<!--                </td>-->
<!--              </tr>-->

              <tr>
                <td align='center' valign='center' style='padding-bottom: 40px; line-height: 18px; font-size: 14px; color: #666666'>
                  Linkfluencer Pty Ltd © 2021 All rights reserved.
                </td>
              </tr>

            </table>
          </div>
        </div>
      </td>
    </tr>
  </table>
</div>
</body>
</html>`);
};
