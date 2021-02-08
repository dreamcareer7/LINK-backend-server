/**
 * Config
 * */
const config = require('./../config');
module.exports = ({ firstName, lastName, resetPasswordLink }) => {
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
<body style='background-color: #F3F3F5; box-sizing: border-box'>
<table style='width: 100%;'>
  <tr>
    <td align='center' valign='center' width="740" style="background-color: #F3F3F5;">
      <table width="740" cellspacing='0' cellpadding='0' style="background-color: white">
        <tr>
          <td align='left' valign='top' height="300" style="position: relative; height: 300px; padding: 30px 0 0 40px; background-image: url('https://link.dev.gradlesol.com/app/mail-images/link-bg.png'); background-repeat:no-repeat; background-size:cover;">
            <img style='height: 30px' height="30" src='${config.backEndBaseUrl}mail-images/link-logo.png'/>
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400; color: #666666'>
            Hey ${firstName ? firstName : ''}${lastName ? ' ' + lastName : ''},
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            A little birdy told me you have forgotten your password?
          </td>
        </tr>


        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Naughty, naughty!
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Don't stress, simply <a href="${resetPasswordLink}" style="font-weight: 500; color: #4590E4; text-decoration: none">follow this link</a> and reset the password.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Just don't forget it next time, or else!
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px 30px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Team linkfluencer®
          </td>
        </tr>

        <tr>
          <td align='center' valign='center'>
            <table width="90%"
                   style='padding: 40px 40px 30px 40px; font-size: 16px; line-height: 24px; color: #FFFFFF; background-color: #4590E4; border-radius: 16px'
            >
              <tr>
                <td align='center' valign='center' style='padding-bottom:10px; font-size: 24px; font-weight: 500'>
                  Get the Latest News
                </td>
              </tr>

              <tr>
                <td align='center' valign='center' style='font-size: 16px;'>
                  <div style="width: 70%">
                    Follow our blogs for all the recent updates, features and strategies on LinkedIn.
                  </div>
                </td>
              </tr>

              <tr>
                <td valign="center" align="center" style="padding-top: 20px">
                  <a href="https://linkfluencer.com/blog" style="text-decoration: none;">
                        <span
                                style='width: 150px; line-height: 23px; text-align: center; font-size: 16px; font-weight: 500; color: #FFFFFF; padding: 7px 25px!important; background-color: #469A20; border-radius: 20px!important; outline: none; cursor: pointer'>
                          READ MORE
                        </span>
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center">
            <table cellpadding="2" style="padding: 20px 0 15px 0">
              <tr>
                <td><a href="https://www.facebook.com/au.linkfluencer/" style="text-decoration: none; cursor:pointer;"><img height="40" src='${
                    config.backEndBaseUrl
                }mail-images/facebook.png' /></a></td>
                <td><a href="https://www.linkedin.com/company/linkfluencer-pty-ltd/" style="text-decoration: none; cursor:pointer;"><img height="40" src='${
                    config.backEndBaseUrl
                }mail-images/linkedin.png' /></a></td>
                <td><a href="https://www.youtube.com/channel/UC8ff9YC96plcIo47biGcYSg" style="text-decoration: none; cursor:pointer;"><img height="40" src='${
                    config.backEndBaseUrl
                }mail-images/youtube.png' /></a></td>
              </tr>
            </table>
          </td>
        </tr>

<!--        <tr>-->
<!--          <td align='center' valign='center' style='font-size: 16px; color: #666666'>-->
<!--            <a href='https://www.facebook.com/nunacompanion' target='_blank'-->
<!--               style='display:block; margin: 10px 0; color: #666666; font-weight: 500'>-->
<!--              Unsubscribe-->
<!--            </a>-->
<!--          </td>-->
<!--        </tr>-->

        <tr>
          <td align='center' valign='center' style='padding-bottom: 40px; line-height: 18px; font-size: 16px; color: #666666'>
            Linkfluencer Pty Ltd © 2021 All rights reserved.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`);
};
