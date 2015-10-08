plugin.controller('namespacedRecordSmsSettingsCntl', [
	'$scope',
	'$routeParams',
	'$firebase',
	'znMessage',
	'znData',
	'znFiltersPanel',
	function (
		$scope,
		$routeParams,
		$firebase,
		znMessage,
		znData,
		znFiltersPanel
	) {

		/**
		 * Save Plugin Settings
		 */
		$scope.save = function() {
			
			var baseUrl = 'https://plugins.zenginehq.com/workspaces/' + $routeParams.workspace_id,
				data = {
					workspace: {
						id: $routeParams.workspace_id
					},
					resource: 'records',
					includeRelated: false,
					url: baseUrl + '/' + $scope.pluginName + '/sms-messages'
				};

			$scope.settings.webhook = $scope.settings.webhook || {};

			if ($scope.settings.webhook.id) {
				znData('Webhooks').delete({id: $scope.settings.webhook.id});
			}

			if ($scope.settings.webhook.form &&
				$scope.settings.webhook.form.id) {
				data['form.id'] = $scope.settings.webhook.form.id;
			}

			if ($scope.settings.webhook.filter) {
				data['filter'] =  $scope.settings.webhook.filter;
			}

			var success = function(response) {

				if (response && response.id) {
					$scope.settings.webhook.id = response.id;
					$scope.secrets.webhookSecretKey = response.secretKey;
				}

				$scope.updateFirebaseData();

				znMessage('Settings Updated', 'saved');

			};

			znData('Webhooks').save(data, success);

		};

		$scope.updateFirebaseData = function() {
			
			var secrets = angular.extend({}, $scope.secrets);

			// so we don't remove any existing auth token,
			// if it's missing from the form 
			if (!secrets.twillioAuthToken) {
				delete secrets.twillioAuthToken;
			}

			// Use an $update here for write-only properties
			$scope.secretsSync.$update(secrets);

			delete $scope.secrets.twillioAuthToken;

			$scope.settings.$save();

		};

		/**
		 * Reset Filter
		 */
		$scope.resetFilter = function() {
			delete $scope.settings.webhook.filter;
			$scope.filterCount = null;   
		};

		/**
		 * Open Filter Panel
		 */
		$scope.openFiltersPanel = function() {

			var params = {
				formId: $scope.settings.webhook.form.id,
				subfilters: false,
				onSave: function(filter) {
					$scope.settings.webhook.filter = filter;
					$scope.filterCount = filter[Object.keys(filter)[0]].length;
				}
			};

			if ($scope.settings.webhook && $scope.settings.webhook.filter) {
				params.filter = $scope.settings.webhook.filter;
			}

			znFiltersPanel.open(params);
		};

		/**
		 * Connect to Firebase
		 */
		$scope.connect = function() {

			$scope.secrets = {};

			// Firebase reference
			var ref = new Firebase($scope.plugin.firebaseUrl + '/' + $routeParams.workspace_id);

			// Authenticate user
			ref.auth($scope.plugin.firebaseAuthToken, function(err, res) {

				// Log error if present and return
				if (err) {
					console.log(err);
					return;
				}

				// Set reference to secrets (non-readable by the frontend)
				$scope.secretsSync = $firebase(ref.child('secrets'));

				// Fetch readable settings
				$scope.settings = $firebase(ref.child('settings')).$asObject();

				$scope.settings.$loaded().then(function(data) {
					$scope.loading = false;
					if ($scope.settings.webhook && $scope.settings.webhook.filter) {
						var filter = $scope.settings.webhook.filter;
						$scope.filterCount = filter[Object.keys(filter)[0]].length;
					}
				});

			});

		};

		/**
		 * Load Forms For Workspace
		 *
		 */
		znData('Forms').query(
			{
				workspace: { id: $routeParams.workspace_id },
				related: 'fields',
				attributes: 'id,name,singularName'
			},
			function(data) {
				$scope.forms = data;
			}
		);

		/**
		 * Get plugin data
		 *
		 */
		$scope.loading = true;

		znData('Plugins').get(
			// Params
			{
				namespace: $scope.pluginName
			},
			// Success
			function(resp) {
				// Note: the response comes back as an array, but because namespaces are unique
				// this request will contain just one element, for convenience let assign the
				// first element to `$scope.plugin`
				$scope.plugin = resp[0];
				$scope.connect();
			},
			// Error
			function(resp) {
				$scope.err = resp;
			}
		);

	}
])
.register('namespaced-record-sms', {
	route: '/namespaced-record-sms',
	title: 'Record SMS Plugin',
	icon: 'icon-mobile',
	interfaces: [
		{
			controller: 'namespacedRecordSmsSettingsCntl',
			template: 'namespaced-record-sms-settings',
			type: 'settings'
		}
	]
});