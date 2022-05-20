/*
 * This microservice fetches a file from File Store, parses it and pumps rows into 
 * the Creator form
 *  This is invoked from the back end only
 *
 */

const fs = require('fs');
const axios = require('axios');
const catalyst = require('zcatalyst-sdk-node');



const CREDENTIALS = {
    CreatorConnector: {
        client_id: '1000.IYP7XN8YWUA6K2LNL5LH',
        client_secret: 'a0a667c8d41c30d53b0784d36d',
        auth_url: 'https://accounts.zoho.com/oauth/v2/auth',
        refresh_url: 'https://accounts.zoho.com/oauth/v2/token',
        refresh_token: '1000.4e0815f3d15a003f.beb23ca5e2d364ed9d143a046e58c6fc'
    }
};
module.exports = async(context, basicIO) => {

    const catalystApp = catalyst.initialize(context);
    let filestore = catalystApp.filestore();
    let data = {};

    let folder_here = filestore.folder('1788000000855042');
    let downloadPromise = await folder_here.downloadFile('1788000000862078');

    fs.writeFileSync('feedbacks.txt', downloadPromise, async(err) => {
        if (!err) {
            console.log('Data written');
        }
    });
    const accessToken = await catalystApp.connection(CREDENTIALS).getConnector('CreatorConnector').getAccessToken();


    //   fs.readFileSync('./feedbacks.txt', 'utf-8').split(/\r?\n/).forEach(async function(line) {


    let fileDetails = (await fs.promises.readFile('./feedbacks.txt', 'utf-8')).toString();
    fileDetails.split(/\r?\n/).forEach(async function(line) {


        let tempLine = line.split('-');

        let dataToSend = {
            "Email": tempLine[0],
            "MovieName": tempLine[1],
            "Feedback": tempLine[2]
        };

        data = dataToSend;

        await addRecords2Creator(data, accessToken);
        basicIO.write('record added to Creator');

    })

};


/**
 * 
 * @param {'The data to add to Creator} data 
 * @param {* The access token } accessToken 
 * @returns nothing
 */

const addRecords2Creator = async(data, accessToken) => {

    try {

        if (accessToken == null) {
            console.log('accesstoken is null');
        }
        let config = {
            method: 'post',
            url: 'https://creator.zoho.com/api/v2/shankarr1002_zohocorp/customer-feedbacks/form/Feedbacks',
            headers: {
                'Authorization': 'Zoho-oauthtoken ' + accessToken,
                'Content-Type': 'application/json',
            },
            data: { "data": data }
        };
        console.log(JSON.stringify(config));

        const response = await axios(config);
        if (response.status == 200) {
            console.log(" record added to creator ");
        }

    } catch (e) {
        console.log("Failure " + e.statusText);
    }
}
