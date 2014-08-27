/**
 * Chat Controller
 */
plugin.controller('chatCntl', ['$scope', '$routeParams', 'znData', '$firebase', function ($scope, $routeParams, znData, $firebase) {

	/**
	 * Load indicator
	 */
	$scope.loading = true;

	/**
	 * Connect with Firebase
	 */
	$scope.connect = function() {
		
		// Room reference
		var ref = new Firebase($scope.plugin.firebaseUrl + '/rooms/' + $routeParams.workspace_id);
		
		// Authenticate user and set presence
		ref.auth($scope.plugin.firebaseAuthToken, function(err, res) {
			
			// Set error if present and returns
			if (err) {
				$scope.err = err;
				$scope.$apply();
				return;
			}

			// Set presence using the Firebase low level API
			var session = new Firebase($scope.plugin.firebaseUrl + '/rooms/' + $routeParams.workspace_id + '/sessions/' + $scope.me.id);
			var connection = new Firebase($scope.plugin.firebaseUrl + '/.info/connected');

			// Will set an element in the session list when the user is connected and
			// automatically remove it when the user disconnects
			connection.on('value', function(snapshot) {

				if (snapshot.val() === true) {

					// Add current user to the room sessions
					session.set(true);

					// Remove on disconnect
					session.onDisconnect().remove();

				}

			});

			// Remove the user from the active sessions list when the plugin is closed
			$scope.$on('$destroy', function() {
				session.remove(); 
			});

			// Set sessions
			$scope.sessions = $firebase(ref.child('sessions')).$asObject();

			// Set messages
			$scope.messages = $firebase(ref.child('/messages')).$asArray();

			// Set loading
			$scope.loading = false;

			// Apply changes to the scope
			$scope.$apply();
			
		});
		
	};

	/**
	 * Get all members in a workspace
	 *
	 * equivalent to: GET https://stage-api.zenginehq.com/v1/workspaces/{workspaceId}/members
	 */
	znData('WorkspaceMembers').query(
		// Params
		{
			workspaceId: $routeParams.workspace_id
		},
		// Success
		function(resp) {
			$scope.members = resp;
		},
		// Error
		function(resp) {
			$scope.err = resp;
		}
	);

	/**
	 * Get plugin data
	 *
	 * equivalent to: GET https://stage-api.zenginehq.com/v1/plugins/?namespace=chat
	 */
	znData('Plugins').get(
		// Params
		{
			namespace: 'chat'
		},
		// Success
		function(resp) {
			// Note: the response comes back as an array, but because namespaces are unique
			// this request will contain just one element, for convenience let assign the
			// first element to `$scope.plugin` to save us the need to refer to it as `$scope.plugin[0]`
			// to read plugin properties
			$scope.plugin = resp[0];
		},
		// Error
		function(resp) {
			$scope.err = resp;
		}
	);

	/**
	 * Get current logged user in Zengine
	 *
	 * equivalent to: GET https://stage-api.zenginehq.com/v1/users/me
	 */
	znData('Users').get(
		// Params
		{
			id: 'me'
		},
		// Success
		function(resp) {
			$scope.me = resp;
		},
		// Error
		function(resp) {
			$scope.err = resp;
		}
	);

	/**
	 * Wait for members, plugin and current user data to be loaded before connect with Firebase
	 */
	var unbindInitalDataFetch = $scope.$watchCollection('[members, plugin, me]', function() {

		// If there is an err in the scope:
		// 1. Change the state of the loading indicator to false
		// 2. Remove the watcher
		// 3. Return (the plugin.html should contain logic to show the error message)
		if ($scope.err) {
			$scope.loading = false;
			unbindInitalDataFetch();
			return;
		}

		// Check if all of the three `$scope` properties have been defined
		// 1. Remove the watcher
		// 2. Call `$scope.connect` to connect with Firebase
		if ($scope.members !== undefined && $scope.plugin !== undefined && $scope.me !== undefined) {
			unbindInitalDataFetch();
			$scope.connect();
		}
		
	});

	/**
	 * Add a new message
	 */
	$scope.addMessage = function() {
		
		if (!$scope.form || !$scope.form.message) {
			return;
		}

		$scope.messages.$add({
			userId: $scope.me.id,
			text: $scope.form.message,
			timestamp: Firebase.ServerValue.TIMESTAMP
		});

		$scope.form.message = null;
		
	};
	
}])


/**
 * Messages Directive
 */
.directive('chatMessage', [function() {
	return {
		scope: {
			message: '=',
			members: '='
		},
		templateUrl: 'chat-message',
		link: function postLink(scope, element, attrs) {
			var unbind = scope.$watch('members', function(members) {
				if (!members) {
					return;
				}
				angular.forEach(members, function(member) {
					if (member.user.id === scope.message.userId) {
						scope.member = member;
					}
				});
				unbind();
				scope.$emit('chatAutoscroll');
			});
		}
	};
}])

/**
 * Autoscroll Directive
 */
.directive('chatAutoscroll', ['$timeout', function($timeout) {
	return {
		link: function postLink(scope, element, attrs) {
			scope.$on('chatAutoscroll', function() {
				$timeout(function() {
					element.scrollTop(element[0].scrollHeight);
				});
			});
		}
	};
}])
 
/**
 * Registration Settings
 */
.register('chat', {
	route: '/chat',
	controller: 'chatCntl',
	template: 'chat-main',
	title: 'Chat',
	pageTitle: false,
	fullPage: true,
	topNav: true,
	order: 300,
	icon: 'icon-chat'
});