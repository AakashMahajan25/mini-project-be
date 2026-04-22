const moment = require("moment");

const verificationTemplate = (otp) => `<!DOCTYPE html language="en">
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet">
</head>

<body style="background-color:white;font-family: 'Poppins', Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" bgcolor="white">
        <tbody>
            <tr>
                <td align="center">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="col-550" width="550">
                        <tbody>
                            <tr>
                                <td align="center" style="padding-right: 20px;padding-left:20px">

                                    <a href="#" style="text-decoration: none;">
                                        <p style="color:#1A5294;
                                                  font-weight:900;
                                                  font-size: 30px;
                                                  margin-bottom: 10px;">
                                            Your Frruit OTP for Secure Access
                                        </p>
                                    </a>
                                    <img src="cid:verify" style="width:100%;height:491px" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr style="text-align: center;">
                <td>
                    <p style="font-weight: 600;text-align: center;font-size: 22px;color:#1A5294;margin-bottom: 10px;">
                        Here are the details of your OTP
                    </p>
                    <p style="font-weight: 700;text-align: center;font-size: 49px;color:#1A5294;margin-top:0px;margin-bottom: 0px;">${otp}</p>
                    <p style="font-weight: 500;text-align: center;font-size: 22px;color:#747CA0;margin-top: 10px;">
                        Validity period : 30 Minutes</p>
                </td>
            </tr>
            <tr style="text-align: left;padding-left:20px;">
                <td>
                    <button style="border: 0.5px solid #E5E5E5;margin-left:20px;width:150px;background-color: #E5E5E5;">
                    </button>
                </td>
            </tr>
            <tr style="height: 90px;">
                <td style="padding-right: 20px;padding-left:20px">

                    <p style="font-weight: 400;font-size: 17px;
                              letter-spacing: 0.025em;
                              color:#747CA0;">
                        Your OTP (One-Time Password) adds an essential layer of security, ensuring a safe and seamless experience as you engage with our platform.

                    </p>
                    <p style="font-weight: 400;font-size: 17px;
                              letter-spacing: 0.025em;
                              color:#747CA0;">
                        Please remember, your OTP is confidential; never share it with anyone, including Frruit representatives. Our team will never request your OTP via phone, email, or any other channel.
                    </p>
                    <p style="font-weight: 400;font-size: 17px;
                              letter-spacing: 0.025em;
                              color:#747CA0;">
                        Thank you for choosing Frruit. We appreciate your trust and look forward to supporting you.
                    </p>
                    <p style="font-size: 18px;color:#747CA0;margin-top: 10px;">
                        If you have any questions, feel free to reach out to our Airrchip customer success team at
                        <a href="mailto:support@airrchip.com" style="font-weight: 600;color:#1A5294;">support@airrchip.com</a>.
                    </p>
                </td>
            </tr>

            <tr style="display: inline-block;">
                <td style="
                           padding-right: 20px;padding-left:20px;
                           border: none; 
                           background-color: white;">

                    <p style="font-size: 18px;color:#747CA0;margin-top: 10px;margin-bottom: 0px;">
                        Thanks,
                    </p>
                    <p style="font-size: 18px;color:#1A5294;;margin-top: 10px;margin-bottom: 0px;">
                        The Frruit Team
                    </p>
                </td>
            </tr>
            <tr style="border: none; 

            height: 40px; 
            color:white; 
            padding-bottom: 20px; 
            text-align: center;
            ">

                <td height="60px" align="center" style="padding-bottom: 20px;">
                    <p
                        style="color:white;line-height: 1.5em;color:#1A5294;font-weight: 700;margin-bottom: 10px;margin-top: 40px;">
                        To know more about us visit our website :
                    </p>
                    <a href="https://www.frruit.co" style="font-weight: 400;color:#1A5294;margin-bottom: 20px;">www.frruit.co</a>
                </td>
            </tr>
        </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
</body>

</html>`

const welcomeTemplate = () => `<!DOCTYPE html lang="en">
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet">
</head>

<body style="background-color:white;font-family: 'Poppins', Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" bgcolor="white">
        <tbody>
            <tr>
                <td align="center">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="col-550" width="550">
                        <tbody>
                            <tr>
                                <td align="center" style="padding-right: 20px;padding-left:20px">

                                    <a href="#" style="text-decoration: none;">
                                        <p style="color:#1A5294;
                                                  font-weight:900;
                                                  font-size: 30px;
                                                  margin-bottom: 10px;">
                                            Welcome to Frruit!
                                        </p>
                                    </a>
                                    <p style="font-size: 18px;text-align: center;color:#747CA0;margin-top: 10px;">
                                        We’re thrilled to have you with us—let’s get started!
                                    </p>
                                    <img src="cid:welcome" style="width:100%;height:514px" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr style="height: 90px;">
                <td style="padding-right: 20px;padding-left:20px">

                    <p style="font-weight: 400;font-size: 17px;
                              letter-spacing: 0.025em;
                              color:#747CA0;">
                        At
                        <span style="color:#1A5294;font-weight: 600;">Frruit</span>
                        , we believe revolutionizing financial markets through innovation
                        and expertise,
                        setting new standards in trading and investment. With our dedication to excellence, we empower
                        clients to navigate markets confidently
                    </p>
                </td>
            </tr>
            <tr style="text-align: center;">
                <td>
                    <a href="https://app.frruit.co" style="text-decoration: none;">
                        <button
                            style="color:white;font-weight: 700;font-size: 18px;line-height: 37.5px;border-radius: 46px;border: none;background-color:#1A5294;padding: 5px 15px;cursor: pointer;">
                            Get Started with Frruit
                        </button>
                    </a>
                </td>
            </tr>

            <tr>
                <td>
                    <p style="border:1px solid #E5E5E5 ;width:200px"></p>
                </td>
            </tr>

            <tr style="display: inline-block;">
                <td style="height: 150px;
                           padding-right: 20px;padding-left:20px;
                           border: none; 
                           background-color: white;">

                    <h2 style="text-align: left;
                               align-items: center;
                               margin-bottom: 0px;
                               margin-top: 30px;
                               color:#1A5294;
                               font-size: 22px;">
                        Need help?
                    </h2>
                    <p style="font-size: 18px;color:#747CA0;margin-top: 10px;">
                        Have questions about Frruit? Our support team is ready to help—reach us anytime at 
                        <a href="mailto:support@airrchip.com" style="font-weight: 600;color:#1A5294;">support@airrchip.com</a>
                    </p>
                    <p style="font-size: 18px;color:#747CA0;margin-top: 10px;margin-bottom: 0px;">
                        Thanks,
                    </p>
                    <p style="font-size: 18px;color:#1A5294;;margin-top: 10px;margin-bottom: 0px;">
                        The Frruit Team
                    </p>
                </td>
            </tr>
            <tr style="border: none; 

            height: 40px; 
            color:white; 
            padding-bottom: 20px; 
            text-align: center;
            ">

                <td height="40px" align="center" style="padding-bottom: 20px;">
                    <p style="color:white;line-height: 1.5em;color:#1A5294;font-weight: 700;margin-bottom: 10px;">
                        To know more about us visit our website :
                    </p>
                    <a href="https://www.frruit.co" style="font-weight: 400;color:#1A5294;margin-bottom: 20px;">www.frruit.co</a>
                </td>
            </tr>
        </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
</body>

</html>`

const planBuyTemplate = ({creditsOffered, price}) => `<!DOCTYPE html lang="en">
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet">
</head>

<body style="background-color:white;font-family: 'Poppins', Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" bgcolor="white">
        <tbody>
            <tr>
                <td align="center">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="col-550" width="550">
                        <tbody>
                            <tr>
                                <td align="center">

                                    <a href="#" style="text-decoration: none;">
                                        <p style="color:#1A5294;
                                                  font-weight:900;
                                                  font-size: 30px;
                                                  margin-bottom: 10px;">
                                            Your Subscription Plan Purchase Confirmation!
                                        </p>
                                    </a>
                                    <p
                                        style="font-size: 18px;text-align: center;color:#747CA0;margin-top: 10px;margin-bottom: 0px;">
                                        Thank you for choosing to elevate your experience with Frruit
                                    </p>
                                    <img src="cid:planImage" style="width:100%;height:491px" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr style="text-align: center;">
                <td>
                    <p style="font-size: 17px;text-align: left;color:#747CA0;margin-top: 10px;margin-bottom: 10px;">
                        Here's a quick overview of what you can expect from your subscription:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td width="50%" valign="top" style="padding-right: 10px;">
                                <ul style="margin: 0; padding: 0 0 10px 20px;">
                                    <li style="font-size: 17px;text-align: left;color:#747CA0;margin-bottom: 5px;font-weight: 400;">Subscription Plan : <span style="font-weight: 600; font-size: 17px;text-align: left;color:#1A5294;"> ₹${price}/month</span></li>
                                    <li style="font-size: 17px;text-align: left;color:#747CA0;margin-bottom: 5px;font-weight: 400;">Subscription Period : <span style="font-weight: 600; font-size: 17px;text-align: left;color:#1A5294;"> 1 Month</span></li>
                                </ul>
                            </td>
                            <td width="50%" valign="top" style="padding-left: 10px;">
                                <ul style="margin: 0; padding: 0 0 10px 20px;">
                                    <li style="font-size: 17px;text-align: left;color:#747CA0;margin-bottom: 5px;font-weight: 400;">Purchase Date : <span style="font-weight: 600; font-size: 17px;text-align: left;color:#1A5294;"> ${moment().format('Do MMMM, YYYY')}</span></li>
                                    <li style="font-size: 17px;text-align: left;color:#747CA0;margin-bottom: 5px;font-weight: 400;">Credit Available : <span style="font-weight: 600; font-size: 17px;text-align: left;color:#1A5294;"> ${creditsOffered}</span></li>
                                </ul>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr style="text-align: center;">
                <td>
                    <button style="color:white;font-weight: 700;font-size: 18px;line-height: 37.5px;border-radius: 46px;border: none;background-color:#1A5294;padding: 5px 15px;margin-top: 20px;">
                        login to Frruit
                    </button>
                </td>
            </tr>
            <tr style="height: 90px;">
                <td>

                    <p style="font-weight: 700;font-size: 17px;
                              letter-spacing: 0.025em;
                              margin-top: 34px;
                              color:#1A5294;">
                        Get access to real-time market data through generative AI on

                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td width="50%" valign="top" style="padding-right: 0px;">
                                <ul style="margin: 0; padding: 0 0 10px 0px;">
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data1" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Curated Investors Stories</span>
                                    </li>
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data2" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Summarise news and get TLDRs</span>
                                    </li>
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data3" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Financial Statements</span>
                                    </li>
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data4" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Corporate Actions</span>
                                    </li>
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data5" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Discover YouTube insights </span>
                                    </li>
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data6" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Search for Reddit opinions</span>
                                    </li>
                                </ul>
                            </td>
                            <td width="50%" valign="top" style="padding-left: 10px;">
                                <ul style="margin: 0; padding: 0 0 10px 30px;">
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data7" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Fundamental Data</span>
                                    </li>
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data8" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Agency Ratings</span>
                                    </li>
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data9" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Event driven market intelligence</span>
                                    </li>
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data10" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Analysts Podcasts</span>
                                    </li>
                                    <li style="font-size: 15px;text-align: left;color:#747CA0;margin-bottom: 11px;font-weight: 400;list-style: none;">
                                        <img src="cid:Data11" style="width:40px;height:40px;vertical-align: middle;">
                                        <span style="vertical-align: middle;margin-left: 5px;">Extract insights from Docs</span>
                                    </li>
                                </ul>
                            </td>
                        </tr>
                    </table>
                </td>
                
            </tr>

            <tr>
                <td>
                    <p style="border:1px solid #E5E5E5 ;width:200px"></p>
                </td>
            </tr>

            <tr style="display: inline-block;">
                <td style="height: 150px;
                           border: none; 
                           background-color: white;">

                    <h2 style="text-align: left;
                               align-items: center;
                               margin-bottom: 0px;
                               margin-top: 15px;
                               color:#1A5294;
                               font-size: 22px;">
                        Need help?
                    </h2>
                    <p style="font-size: 18px;color:#747CA0;margin-top: 10px;margin-bottom: 0px;">
                        Thank you for being an early User! We're eager to witness the remarkable strategies and solutions you develop using our platform.
                    </p>
                    <p style="font-size: 18px;color:#747CA0;margin-top: 10px;">
                        If you have any questions, feel free to email our customer success team at
                        <a href="mailto:support@airrchip.com" style="font-weight: 600;color:#1A5294;">support@airrchip.com</a> 
                    </p>
                    <p style="font-size: 18px;color:#747CA0;margin-top: 10px;margin-bottom: 0px;">
                        Thanks,
                    </p>
                    <p style="font-size: 18px;color:#1A5294;;margin-top: 10px;margin-bottom: 0px;">
                        Frruit Team
                    </p>
                </td>
            </tr>
            <tr style="border: none; 

            height: 40px; 
            color:white; 
            padding-bottom: 20px; 
            text-align: center;
            ">

                <td height="40px" align="center" style="padding-bottom: 20px;padding-top: 40px;">
                    <p style="color:white;line-height: 1.5em;color:#1A5294;font-weight: 700;margin-bottom: 10px;">
                        To know more about us visit our website :
                    </p>
                    <a href="https://www.frruit.co" style="font-weight: 400;color:#1A5294;margin-bottom: 20px;">www.frruit.co</a>
                </td>
            </tr>
        </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
</body>

</html>`

module.exports = Object.assign({}, {
    verificationTemplate,
    welcomeTemplate,
    planBuyTemplate
});