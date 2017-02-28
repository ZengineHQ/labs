Plugin Services allow you to run backend code, including communicating with other APIs. Scheduled Webhooks allow you to execute webhook URLs on a repeating schedule. This example is a plugin service that fetches records and then posts them to HipChat. Combined with Scheduled Webhooks, it can repeat daily to give you a daily todo list. 

## Installation
1. Create a plugin and a plugin service.
2. Download the service draft source and replace the plugin.js with this plugin.js file.
3. Save the updated plugin.js, rezip the service folder, and reupload to your plugin service.
4. Publish your plugin, then install and activate it in your workspace.
5. Create a Scheduled Webhook in the same workspace to run the plugin service once a day.