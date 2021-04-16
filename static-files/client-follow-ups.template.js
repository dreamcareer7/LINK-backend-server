/**
 * Config
 * */
const config = require('../config');
module.exports = ({ firstName, lastName, opportunities, dashboardUrl }) => {
    let mailTemplate = `<html>
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
          <td align='left' valign='top' height="300" style="position: relative; height: 300px; padding: 30px 0 0 40px; background-image: url('${config.backEndBaseUrl}mail-images/link-bg.png'); background-repeat:no-repeat; background-size:cover;">
            <img style='height: 30px' height="30" src='${config.backEndBaseUrl}mail-images/link-logo.png'/>
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Hey ${firstName}.
          </td>
        </tr>
        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Below are sales opportunities you've set to re-engage with today.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400; color: #666666'>
            Once you are done remember to update the contacts profile inside of Jayla based on your actions.
          </td>
        </tr>`;

    for (let i = 0; i < opportunities.length; i++) {
        mailTemplate += `<tr>
          <td align='center' valign='center' style='padding: 5px 0; font-size: 16px; line-height: 24px; color: #464646'>
            <table width='90%' cellspacing='0' cellpadding='10' style='font-size: 16px; color: #464646;'>
              <tr style='padding: 7px 10px; background-color: #F9F9F9; border-radius: 5px'>
                <td valign='center' width="70" style='border-top-left-radius: 7px; border-bottom-left-radius: 7px;'>
                  <table style='font-size: 16px; color: #464646;' cellspacing="10">
                    <tr>
                      <td>
                        <img height="60" width="60" style='height: 60px; width: 60px; border-radius: 50%'
                             src='${opportunities[i].profilePicUrl}' />
                      </td>
                      <td>
                        <div style='font-weight: 600'>${opportunities[i].firstName ? opportunities[i].firstName : ''} ${
            opportunities[i].lastName ? opportunities[i].lastName : ''
        }</div>
                        <div>${opportunities[i].title ? opportunities[i].title : ''}</div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td width="30" style='border-top-right-radius: 7px; border-bottom-right-radius: 7px;'>
                  <div style='font-weight: 600'>Stage</div>
                  <div>${opportunities[i].stageStr ? opportunities[i].stageStr : ''}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    }
    mailTemplate += `<tr>
          <td align='left' valign='center'>
            <table style="padding: 10px 0 0 40px">
              <tr>
                <td>
                  <a href="${dashboardUrl}" style="text-decoration: none">
                  <button
                          style='width: 150px; padding: 7px 10px; background-color: #469A20; border-radius: 20px; font-size: 16px; font-weight: 500; color: #FFFFFF; border: none; outline: none'>
                    ACTION NOW
                  </button>
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <tr>
          <td align='left' valign='center'style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400; color: #666666'>
            Good luck with the following them up. :)
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400; color: #666666'>
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
                    <td><a href="https://www.facebook.com/au.linkfluencer/" style="text-decoration: none; cursor:pointer;"><img height="40" src='${config.backEndBaseUrl}mail-images/facebook.png' /></a></td>
                    <td><a href="https://www.linkedin.com/company/linkfluencer-pty-ltd/" style="text-decoration: none; cursor:pointer;"><img height="40" src='${config.backEndBaseUrl}mail-images/linkedin.png' /></a></td>
                    <td><a href="https://www.youtube.com/channel/UC8ff9YC96plcIo47biGcYSg" style="text-decoration: none; cursor:pointer;"><img height="40" src='${config.backEndBaseUrl}mail-images/youtube.png' /></a></td>
                  </tr>
                </table>
                </td>
              </tr>

<!--        <tr>-->
<!--          <td align='center' valign='center' style='font-size: 16px; color: #666666; padding: 10px 0'>-->
<!--            <a href='https://www.facebook.com/nunacompanion' target='_blank'-->
<!--               style='display:block; color: #666666; font-weight: 500'>-->
<!--              Unsubscribe-->
<!--            </a>-->
<!--          </td>-->
<!--        </tr>-->

        <tr>
          <td align="center" valign="center" style="line-height: 18px; font-size: 16px; color: #666666">
            Linkfluencer
          </td>
        </tr>

        <tr>
          <td align="center" valign="center" style="line-height: 18px; font-size: 16px; color: #666666">
            Exchange Tower
          </td>
        </tr>

        <tr>
          <td align="center" valign="center" style="line-height: 18px; font-size: 16px; color: #666666">
            Level 1, 530 Little Collins St.
          </td>
        </tr>

        <tr>
          <td align="center" valign="center" style="line-height: 18px; font-size: 16px; color: #666666">
            Melbourne, Victoria 3000
          </td>
        </tr>

        <tr>
          <td align="center" valign="center" style="line-height: 18px; font-size: 16px; color: #666666">
            Australia
          </td>
        </tr>

        <tr>
          <td align="center" valign="center" style="padding: 20px 0; line-height: 18px; font-size: 16px; color: #666666">
            03 9909 7777
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
    return mailTemplate;
};
