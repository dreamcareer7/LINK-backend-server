/**
 * Config
 * */
const config = require('./../config');
module.exports = ({ linkedInSignUpLink, firstName, lastName }) => {
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
          <td align='left' valign='top' height="300" style="position: relative; height: 300px; padding: 30px 0 0 40px; background-image: url('${
              config.backEndBaseUrl
          }mail-images/link-bg.png'); background-repeat:no-repeat; background-size:cover;">
            <img style='height: 30px' height="30" src='${config.backEndBaseUrl}mail-images/link-logo.png'/>
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400; color: #666666'>
            Hey ${firstName ? firstName : ''},
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Congrats on signing up to Jayla.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            You now have access to your own personal sales assistant, how good is that? :)
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            To get started, it's <a href="${linkedInSignUpLink}" style="font-weight: 500; color: #4590E4; text-decoration: none">extremely important
            that you follow this link</a> and action the instructions step by step.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Might also be worth starring this email or bookmarking the page so it's easy to find.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Once you've done everything you're ready to go.
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            After that, anytime you want to use Jayla make sure you're:
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px 0 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            1) Logging in via the Google Chrome extension
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 0px 40px 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            2) Already signed into your LinkedIn account
          </td>
        </tr>

        <tr>
          <td align='left' valign='center' style='padding: 10px 40px; font-size: 16px; line-height: 24px; font-weight: 400;  color: #666666'>
            Best of Luck!
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

<!--        <tr>-->
<!--          <td align='center' valign='center' style='font-size: 16px; color: #666666'>-->
<!--            <a href='https://www.facebook.com/nunacompanion' target='_blank'-->
<!--               style='display:block; padding: 10px 0; color: #666666; font-weight: 500'>-->
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
