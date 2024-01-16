# Joining [Botkit](https://botkit.ai) to Facebook using [Azure Bot Framework](https://dev.botframework.com/)

## Create Azure Bot using Nodejs
Things to note:

* The type of bot doesn't matter as most of the code in app.js will be overwritten with Botkit code.
* Under Settings => Configuration, change the Messaging endpoint to "https://{YOUR BOTS URL}/botframework/receive"
    * Ex: https://your-bot-app-name.azurewebsites.net/botframework/receive
* In Application Settings, include the following empty environmental variables. They will be filled in later.
    * access_token
    * verify_token
    * app_secret


## Create Facebook app

To setup, follow the steps found in [Configure Botkit and Facebook Messenger](https://botkit.ai/docs/provisioning/facebook_messenger.html).

**Adding Messenger as app product**

Things to note:

* For token generation:
    1. Create a Facebook page for your the Facebook app you created.
    2. Once created, return to the Token Generation setting, select your page, and create your token.
    3. Copy the token value.
    4. In your Azure bot Application settings, add the token value in for the 'access_token' key created earlier.
    5. Save your settings.

* For webhook setup:
    1. Under Callback URL, enter the same URL entered as your Messaging endpoint in your Azure bot.
        * "https://{YOUR BOTS URL}/botframework/receive"
    2. Create a verify token value and enter that. This is a made up value.
    3. Copy the verify token value.
    4. Select your subscription fields. Suggested values are:
        * messages
        * messaging_postbacks
        * messaging_optins
        * message_deliveries
        * message_reads
    5. Click Verify and Save
    6. In your Azure bot Application settings, add the token value in for the 'verify_token' key created earlier.
    7. Save your settings.

* Under your Facebook app settings (not the Messenger settings),
    1. Copy your App Secret value.
    2. In your Azure bot Application settings, add the token value in for the 'app_secret' key created earlier.
    3. Save your settings.

## Add Facebook Messenger to your page and run
**Unless your Facebook app is published, only approved roles will be able to test the bot**

To test from your apps page:

1. Click "+ Add a Button".
2. Select "Contact you", then "Send Message".
3. Click Next.
4. Select "Facebook Messanger"
5. Click Finish.
6. Mouse over "Send Message" and select "Test Button"

To test from within Messenger:

1. Add your Facebook app as a contact (if not already present)