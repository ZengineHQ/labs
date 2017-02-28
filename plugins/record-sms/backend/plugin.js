exports.run = function(eventData) {

	var sendSms = function(settings, secrets) {

		if (eventData.request.body.data &&
			eventData.request.body.data[0].action === 'create') {

			var accountSid = settings.twillio.accountSid, 
				authToken = secrets.twillioAuthToken,
				client = require('twilio')(accountSid, authToken);

			var recordId = eventData.request.body.data[0].record.id;

			var message = settings.sms.body || 'Record' + recordId + ' was created!'; 

			var params = {
				body: message,
				to: settings.sms.to,
				from: settings.sms.from
			};

			client.sms.messages.create(params, function(err, sms) {

				if (err) {
					eventData.response.status(404).send(err);
				} else {
					eventData.response.status(200).send(sms);
				}

			});

		} else {
			eventData.response.status(403).send('Forbidden');
		}

	};

	var workspaceId = eventData.request.params.workspaceId;

	znFirebase().child(workspaceId + '/secrets').once('value', function(secrets) {

		znFirebase().child(workspaceId + '/settings').once('value', function(settings) {
			sendSms(settings.val(), secrets.val());
		});

	}, function (err) {
		eventData.response.status(500).send(err);
	});

}