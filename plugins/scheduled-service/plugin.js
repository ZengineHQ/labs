// Plugin code goes here
var znHttp = require('./lib/zn-http'),
	requestify = require('requestify');

exports.run = function(eventData) {

	// Scheduled Webhooks use POST
	if (eventData.request.method === 'POST') {

		var formId = eventData.request.query.formId,
			folderId = eventData.request.query.folderId || 0,
			hipchatRoom = eventData.request.query.hipchatRoom,
			hipchatToken = eventData.request.query.hipchatToken,
			scheduledData = eventData.request.body.data;

		znHttp().get('/forms/' + formId + '/records?folder.id=' + folderId).then(function(response) {

			var body = response.getBody(),
				records = body.data,
				message = [];

			message.push('Scheduled @ ' + scheduledData.scheduled);

			records.forEach(function(record) {
				message.push(record.id + ' - ' + record.name);
			});

			message.push('Next Scheduled @ ' + scheduledData.nextScheduled);

			message = message.join("\n");

			requestify.post('https://api.hipchat.com/v2/room/' + hipchatRoom + '/message?auth_token=' + hipchatToken, {
				message: message
			}).then(function() {
				// return message
				eventData.response.status(200).send(message);
			}, function(error) {
				eventData.response.status(404).send(error);
			});

		}, function(error) {
			eventData.response.status(404).send(error);
		});
		
	} else {
		eventData.response.status(404).send('Not found');
	}

};