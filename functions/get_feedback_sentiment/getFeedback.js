/*
 *  This file is a basicIO which receives data from Creator when a form is filled and submitted
 * The data obtained are - Feedbacks and ID of the form submitted.
 *  Upon receiving the feedback, ZIA text analysis is invoked to obtain the Sentiment
 * The sentiment is updated back to the Creator app
 *  Also a record gets added to CRM as a Lead
 */


const axios = require('axios');
const catalyst = require('zcatalyst-sdk-node');

//The process to generate this is different from what we did for extensions. In the extensions case, we create a portal
// for each account. But here, it is a direct one to a single account only. 
// Read the api documentation to learn how
//scope=ZohoCreator.form.UPDATE
const CREDENTIALS = {
    CreatorConnector: {
        client_id: '1000.IYP7XM46K2LNL5LH',
        client_secret: 'a0a6673f901c8d41c30d53b0784d36d',
        auth_url: 'https://accounts.zoho.com/oauth/v2/auth',
        refresh_url: 'https://acounts.zoho.com/oauth/v2/token',
        refresh_token: '1000.4baf3d15a003f.beb23ca5e2d364ed9d143a046e58c6fc'
    }
};

/**
 *  The function name gets invoked as a function from Creator. The parameters are received from the Creator function call
 * @param   {* feedback data received from the creator } feedback 
 * @param {* email of the person who gave the feedback } email
 * @param {* id of the row  } id
 */

module.exports = async(context, basicIO) => {
    const catalystApp = catalyst.initialize(context);

    const creator_data_feedback = basicIO.getParameter("feedback");
    const creator_data_email = basicIO.getParameter("email");
    let creator_data_id = basicIO.getParameter("id");
    let data = [creator_data_feedback];

    console.log(data);


    const zia = catalystApp.zia();
    const textPromise = await zia.getTextAnalytics(data);
    const accessToken = await catalystApp.connection(CREDENTIALS).getConnector('CreatorConnector').getAccessToken();


    const sentiment = textPromise[0].sentiment_prediction[0].document_sentiment;

    let dataToSend = {
        "Sentiment": sentiment,
        "ID": creator_data_id
    };
    console.log(dataToSend);
    await updateRecordsInCreator(dataToSend, accessToken);

    if (creator_data_id != null) {
        await addRecords2CRMInLeads(creator_data_email, accessToken);

    }
    basicIO.write(JSON.stringify(dataToSend));
    context.close();
};

/**
 * 
 * @param {* file data to be updated} data 
 * @param {* access token } accessToken 
 */

async function updateRecordsInCreator(data, accessToken) {

    try {

        if (accessToken == null) {
            console.log('accesstoken is null');
        }
        let url = 'https://creator.zoho.com/api/v2/shankarr1002_zohocorp/customer-feedbacks/report/Feedbacks_Report/' + data.ID;
        //   console.log(url);
        let config = {
            method: 'patch',
            url: url,
            headers: {
                'Authorization': 'Zoho-oauthtoken ' + accessToken,
                'Content-Type': 'application/json',
            },
            data: { "data": data }
        };
        console.log(JSON.stringify(config));

        const response = await axios(config);
        if (response.status == 200) {
            console.log("Record Updated in Creator");
        }
    } catch (e) {
        console.log("Failure updating record in Creator  " + e);
    }
}


/**
 * 
 * @param {* email of the person who gave the feedback } email 
 * @param {* access token } accessToken 
 */

const addRecords2CRMInLeads = async(email, accessToken) => {

    const reqBody = {
        data: [{
            "Last_Name": 'JoyfulMovieWeekends-N',
            "Email": email
        }]
    };

    try {


        if (accessToken == null) {
            console.log('accesstoken is null');
        }
        let config = {
            method: 'post',
            url: 'https://www.zohoapis.com/crm/v2/Leads',
            headers: {
                'Authorization': 'Zoho-oauthtoken ' + accessToken,
                'Content-Type': 'application/json',
            },
            data: reqBody
        };
        console.log(JSON.stringify(config));

        const response = await axios(config);
        if (response.status == 200) {
            console.log("*******  Lead Added to CRM ******* ");
        }
    } catch (e) {
        console.log("---------Failure in adding Lead to CRM ------------" + e.statusText);
    }
}
