/**
 * Plugin Today Summary Controller
 */
plugin.controller('todaySummaryCntl', ['$scope', 'znData', '$routeParams', '$q', function ($scope, znData, $routeParams, $q) {

	/*
	 * Load up-to-date task & event data from the API
	 */
	$scope.update = function () {
	    if (!$scope.user) {
	        // Need user data to continue. Stop for now
	        return;
	    }
	    
		$scope.loading = true; // display throbber

		var eventParams = {
			// Property names with hyphens/dots need to go in quotes (standard JS stuff)
			'min-end': getTodayBeginning(),
			'max-start': getTodayEnd(),
			sort: 'start'
		};

		var taskParams = {
			due: getCurrentDate(),
			status: 'open|in-progress',
			'assignedToUser.id': $scope.user.id,
			sort: 'priority'
		};

		if ($routeParams.workspace_id) {
			taskParams['workspace.id'] = eventParams['workspace.id'] = $routeParams.workspace_id;
		}

		$q.all([
			znData('Tasks').query(
			    taskParams,
				function success(response) {
					$scope.tasks = response;
				},
				function error(response) {
					console.log('Error loading tasks!');
				}
			),
			znData('Events').query(
			    eventParams,
				function success(response) {
					$scope.events = response;
				},
				function error(response) {
					console.log('Error loading events!');
				}
			)
		]).then(function () {
			// runs when both Tasks and Events queries are done - hide throbber
			$scope.loading = false;
		});
	};
	
	znData('Users').get({id: 'me'}, function (response) {
		$scope.user = response;
	});
	
	/*
	 * Current date at 00:00:00 local time
	 */
	function getTodayBeginning() {
		var startTime = new Date();
		startTime.setHours(0);
		startTime.setMinutes(0);
		startTime.setSeconds(0);
		startTime.setMilliseconds(0);

		return startTime.toISOString();
	}

	/*
	 * Current date at 23:59:59 local time
	 */
	function getTodayEnd() {
		var endTime = new Date();
		endTime.setHours(23);
		endTime.setMinutes(59);
		endTime.setSeconds(59);
		endTime.setMilliseconds(999);

		return endTime.toISOString();
	}

	/*
	 * Current local date, yyyy-MM-dd string
	 */
	function getCurrentDate() {
		return new Date().toString('yyyy-MM-dd');
	}

	// Stop click event propagation - keeps the menu open on internal clicks
	// Important to run this within the controller code, since our plugin is loaded dynamically by the front end
	$('#today-summary-menu').on('click', function (event) {
		event.stopPropagation();
	});

}])
/**
 * Status filter
 */
.filter('todaySummaryStatus', [function () {
		return function (input) {
			var statusMap = {
				'in-progress': 'In Progress',
				'open': 'Unstarted'
			};

			return statusMap[input] || input;
		};
	}])

/**
 * Plugin Registration
 */
.register('todaySummary', {
	controller: 'todaySummaryCntl',
	template: 'today-summary-main',
	title: 'Today Summary Plugin',
	fullPage: false,
	icon: 'icon-th-list',
	location: 'zn-top-nav'
});

