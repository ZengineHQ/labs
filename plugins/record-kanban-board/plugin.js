/**
 * Record Board Controller
 */
plugin.controller('recordBoardCntl', ['$scope', '$routeParams', 'znData', 'znMessage', function ($scope, $routeParams, znData, znMessage) {

	// Current Workspace ID from Route
	$scope.workspaceId = null;

	// Workspace Forms
	$scope.forms = [];

	// Selected Form ID
	$scope.formId = null;

	// Selected Form Folders
	$scope.folders = [];

	// Records Indexed by Folder
	$scope.folderRecords = {};

	// Add Folder Name
	$scope.addFolderName = null;

	// Sortable Options
	$scope.sortableOptions = {
		connectWith: 'ul.record-list',
		items: 'li.record',
		update: function(event, ui) {

			// Ignore Reorder
			if (!ui.sender) {
					return;
			}

			// Traverse Records by Folder
			angular.forEach($scope.folders, function(folder) {
				angular.forEach($scope.folderRecords[folder.id], function(record, index) {
					// Record Found
					if (record.id == ui.item.data('id')) {

						// Update Record Folder ID
						znData('FormRecords').save(
							{
								formId: $scope.formId,
								id: record.id
							},
							{
								folder: { id: folder.id }
							},
							function(response) {
								// Update Folder Records with Response
								$scope.folderRecords[folder.id].splice(index, 1, response);

								znMessage('Record moved', 'saved');
							},
							function(e) {
								znMessage('Error moving record', 'error');
							}
						);
					}
				});
			});
		}
	};

	/**
	 * Load Forms for Workspace
	 */
	$scope.loadForms = function() {
		// Reset Workspace Forms
		$scope.forms = [];

		// Query Forms by Workspae ID and Return Loading Promise
		return znData('Forms').query(
			{
				workspace: {
					id: $scope.workspaceId
				},
				related: 'folders'
			},
			function(response){
				// Set Workspace Forms from Response
				$scope.forms = response;
			}
		);
	};

	/**
	 * Pick Selected Form
	 */
	$scope.pickForm = function(formId) {
		// Set Selected Form ID
		$scope.formId = formId;

		// Reset Form Folders
		$scope.folders = [];

		// Find Form and Set Selected Form Folders
		angular.forEach($scope.forms, function(form) {
			if (form.id == formId) {
				$scope.folders = form.folders;
			}
		});

		// Load Records for Selected Form Folders
		$scope.loadRecords();

	};

	/**
	 * Load Records by Form Folders
	 */
	$scope.loadRecords = function() {
		// Reset Folder Records
		$scope.folderRecords = {};

		var queue = [];

		// Get Records by Folder
		angular.forEach($scope.folders, function(folder) {
			// Initialize Folder Record List
			$scope.folderRecords[folder.id] = [];

			// Query and Index Records by Folder
			var request = znData('FormRecords').query(
				{
					formId: $scope.formId,
					folder: { id: folder.id }
				},
				function(response) {
					$scope.folderRecords[folder.id] = response;
				}
			);

			queue.push(request);
		});

	};

	/**
	 * Add Folder
	 */
	$scope.addFolder = function() {
		var data = {
			name: $scope.addFolderName,
			form: {
				id: $scope.formId
			}
		};

		// Reset Folder Name
		$scope.addFolderName = '';

		// Save New Folder
		return znData('FormFolders').save({formId: $scope.formId}, data, function (folder) {
			// Initialize New Folder Record List
			$scope.folderRecords[folder.id] = [];

			// Append New Folder to Folders List
			$scope.folders.push(folder);

			znMessage('New folder created', 'saved');

			return folder;
		}, function (e) {
			 znMessage('Error creating folder', 'error');
		});
	};

	// Initialize for Workspace ID
	if ($routeParams.workspace_id) {
			// Set Selected Workspace ID
			$scope.workspaceId = $routeParams.workspace_id;

			// Load Workspace Forms
			$scope.loadForms();
	}

}])

/**
 * Plugin Registration
 */
.register('recordBoard', {
	route: '/recordboard',
	controller: 'recordBoardCntl',
	template: 'record-board-main',
	title: 'Record Board',
	pageTitle: false,
	fullPage: true,
	topNav: true,
	order: 300,
	icon: 'icon-th-large'
});
