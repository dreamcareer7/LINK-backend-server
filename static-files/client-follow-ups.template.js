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
                <td align='left' valign='center'>
                  <div style='position:relative;'>
                    <img
                      src='${config.backEndBaseUrl}mail-images/link-bg.png'
                      style='width: 100%'
                    />
                    <img style='position: absolute; top: 30px; left: 40px; height: 30px' src='${
                        config.backEndBaseUrl
                    }mail-images/link-logo.svg'/>
                  </div>

                </td>
              </tr>

              <tr>
                <td align='left' valign='center'>
                  <div
                    style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400; color: #666666'
                  >
                    Hey ${firstName ? firstName : ''} ${lastName ? lastName : ''},
                  </div>
                </td>
              </tr>

              <tr>
                <td align='left' valign='center'>
                  <div
                    style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400;  color: #666666'
                  >
                    Below are sales opportunities you've set to re-engage with today.

                  </div>
                </td>
              </tr>

              <tr>
                <td align='left' valign='center'>
                  <div
                    style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400; color: #666666'
                  >
                    Once you are done remember to update the contacts profile inside of Jayla based on your actions.
                  </div>
                </td>
              </tr>`;

    for (let i = 0; i < opportunities.length; i++) {
        mailTemplate += `<tr>
                <td align='center' valign='center'>
                  <div
                    style='margin: 5px 0; font-size: 14px; line-height: 24px; color: #464646'
                  >
                    <table width='90%' cellspacing='0' cellpadding='10' style='font-size: 14px; color: #464646;'>
                      <tr style='padding: 7px 10px; background-color: #F9F9F9; border-radius: 5px'>
                        <td valign='center' style='border-top-left-radius: 7px; border-bottom-left-radius: 7px;'>
                          <table style='font-size: 14px; color: #464646;'>
                            <tr>
                              <td>
                                <img style='height: 60px; width: 60px; margin-right: 10px; border-radius: 50%'
                                     src='${opportunities[i].profilePicUrl}' />
                              </td>
                              <td style='width: fit-content'>
                                <div style='font-weight: 600'>${
                                    opportunities[i].firstName ? opportunities[i].firstName : ''
                                } ${opportunities[i].lastName ? opportunities[i].lastName : ''}</div>
                                <div>${opportunities[i].title ? opportunities[i].title : ''}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style='border-top-right-radius: 7px; border-bottom-right-radius: 7px;'>
                          <div style='font-weight: 600'>Stage</div>
                          <div>${opportunities[i].stageStr ? opportunities[i].stageStr : ''}</div>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>`;
    }

    mailTemplate += `<tr>
                <td align='left' valign='center'>
                  <button
                          style='width: 150px; margin: 10px 0 0 40px; padding: 7px 10px; background-color: #469A20; border-radius: 20px; border: none; outline: none'>
                    <a href="${dashboardUrl}" style="font-size: 14px; font-weight: 400; color: #FFFFFF; text-decoration: none"> ACTION NOW</a>
                  </button>

                </td>
              </tr>

              <tr>
                <td align='left' valign='center'>
                  <div
                    style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400; color: #666666'
                  >
                    Good luck with the following them up. :)
                  </div>
                </td>
              </tr>

              <tr>
                <td align='left' valign='center'>
                  <div
                    style='padding: 10px 40px; font-size: 14px; line-height: 24px; font-weight: 400; color: #666666'
                  >
                    Team linkfluencer®
                  </div>
                </td>
              </tr>

              <tr>
                <td align='center' valign='center'>
                  <div
                    style='padding: 40px 40px 30px 40px; margin: 0 40px; font-size: 14px; line-height: 24px; color: #FFFFFF; background-color: #4590E4; border-radius: 15px'
                  >
                    <div style='margin-bottom:10px; font-size: 24px; font-weight: 500'>
                      Get the Latest News
                    </div>
                    <div style='width: 70%; margin-bottom:10px; font-size: 14px;'>
                      Follow our blogs for all the recent updates, features and strategies on LinkedIn.
                    </div>
                    <button
                      style='width: 150px; margin: 10px 0; padding: 7px 10px; font-size: 14px; font-weight: 400; color: #FFFFFF; background-color: #469A20; border-radius: 20px; border: none; outline: none'>
                      READ MORE
                    </button>
                  </div>
                </td>
              </tr>

              <tr>
                <td align='center' valign='center'>
                  <a href="#" style="text-decoration: none"><img style='width: 40px; margin: 20px 2px' src='${config.backEndBaseUrl}mail-images/facebook.svg' /></a>
                  <a href="#" style="text-decoration: none"><img style='width: 40px; margin: 20px 2px' src='${config.backEndBaseUrl}mail-images/linkedin.svg' /></a>
                  <a href="#" style="text-decoration: none"><img style='width: 40px; margin: 20px 2px' src='${config.backEndBaseUrl}mail-images/youtube.png' /></a>
                </td>
              </tr>

              <tr>
                <td align='center' valign='center' style='font-size: 14px; color: #666666'>
<!--                  <a href='https://www.facebook.com/nunacompanion' target='_blank'-->
<!--                     style='display:block; margin: 10px 0; color: #666666; font-weight: 500'>-->
<!--                    Unsubscribe-->
<!--                  </a>-->
                  <div style='line-height: 18px'>
                    Linkfluencer
                  </div>
                  <div style='line-height: 18px'>
                    Exchange Tower
                  </div>
                  <div style='line-height: 18px'>
                    Level 1, 530 Little Collins St.
                  </div>
                  <div style='line-height: 18px'>
                    Melbourne, Victoria 3000
                  </div>
                  <div style='line-height: 18px'>
                    Australia
                  </div>
                  <div style='margin: 20px 0'>
                    03 9909 7777
                  </div>
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
</html>`;
    return mailTemplate;
};
