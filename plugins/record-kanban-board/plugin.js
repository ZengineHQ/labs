/**
 * Plugin Record Board Controller
 */
plugin.controller('namespacedRecordBoardCntl', ['$scope', '$routeParams', 'znData', 'znMessage', function ($scope, $routeParams, znData, znMessage) {

	// Current Workspace ID from Route
	$scope.workspaceId = null;

	// Selected Form ID
	$scope.formId = null;

	// Workspace Forms
	$scope.forms = [];

	// Selected Form Folders
	$scope.folders = [];

	// Records Indexed by Folder
	$scope.folderRecords = {};

	// Show Add Folder Flag
	$scope.showAddFolder = false;

	// Add Folder Name
	$scope.addFolderName = null;

	// Selected Folder to Edit
	$scope.editFolder = {
		id: null,
		name: null
	};

	// Sortable Options
	$scope.sortableOptions = {
		connectWith: "ul.records-container",
		items: "li.record",
		stop: function(event, ui) {

			// Traverse Records by Folder
			angular.forEach($scope.folders, function(folder) {
				angular.forEach($scope.folderRecords[folder.id], function(record, index) {
					// Record Found and Folder Changed
					if (record.id == ui.item.data('id') &&
						record.folder.id != folder.id) {

						// Update Record Folder ID
						znData('FormRecords').save({ formId: $scope.formId, id: record.id}, { folder: { id: folder.id }}, function(response) {
							// Update Folder Records with Response
							$scope.folderRecords[folder.id].splice(index, 1, response);
						}, function(e) {
							znMessage('Error moving record', 'error');
						});
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

		var params = {
			workspace: { id: $scope.workspaceId },
			related: 'folders'
		};

		// Query Forms by Workspae ID and Return Loading Promise
		return znData('Forms').query(params).then(function(response){
			// Set Workspace Forms from Response
			$scope.forms = response;
		});
	};

	/**
	 * Load Records by Form Folders
	 */
	$scope.loadRecords = function() {
		// Reset Folder Records
		$scope.folderRecords = {};

		var queue = [];

		var params = {
			formId: $scope.formId,
			folder: {}
		};

		// Get Records by Folder
		angular.forEach($scope.folders, function(folder) {
			// Initialize Folder Record List
			$scope.folderRecords[folder.id] = [];
			
			params.folder.id = folder.id;

			// Query and Index Records by Folder
			var request = znData('FormRecords').query(params).then(function(response) {
					$scope.folderRecords[folder.id] = response;
				}
			);

			queue.push(request);
		});

	};

	/**
	 * Pick Selected Form
	 */
	$scope.pickForm = function(formId) {
		// Reset Form Folders
		$scope.folders = [];

		// Set Selected Form ID
		$scope.formId = formId;

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
	 * Open or Close Add Folder Column
	 */
	$scope.openAddFolder = function(show) {
		$scope.showAddFolder = show;
	};

	/**
	 * Add Folder
	 */
	$scope.addFolder = function() {

		var params = {
			formId: $scope.formId
		};

		var data = {
			name: $scope.addFolderName,
			form: {
				id: $scope.formId
			}
		};

		// Save New Folder
		return znData('FormFolders').save(params, data, function (folder) {
			// Close Add Column
			$scope.openAddFolder(false);

			// Initialize New Folder Record List
			$scope.folderRecords[folder.id] = [];

			// Append New Folder to Folders List
			$scope.folders.push(folder);

			return folder;
		}, function (e) {
			znMessage('Error creating folder', 'error');
		});
	};

	/**
	 * Toggle Edit Folder
	 */
	$scope.toggleEditFolder = function(folderId) {
		if ($scope.editFolder.id == folderId) {
			// Close Edit Folder
			$scope.editFolder.id = null;
			$scope.editFolder.name = null;
		}
		else {
			// Open Edit Folder for Folder ID
			$scope.editFolder.id = folderId;

			// Find Folder Name by ID
			angular.forEach($scope.folders, function(folder)  {
				if (folder.id == folderId) {
					$scope.editFolder.name = folder.name;
				}
			});
		}
	};

	/**
	 * Save Edit Folder
	 */
	$scope.saveFolder = function() {

		var params = {
			formId: $scope.formId,
			id: $scope.editFolder.id
		};

		var data = {
			name: $scope.editFolder.name,
			form: {
				id: $scope.formId
			}
		};

		// Save Folder
		return znData('FormFolders').save(params, data, function (response) {
			// Update Folder in Folders List
			angular.forEach($scope.folders, function(folder, index)  {
				if (folder.id == $scope.editFolder.id) {
					$scope.folders.splice(index, 1, response);
				}
			});

			// Close Edit Folder
			$scope.toggleEditFolder();

			return response;
		}, function (e) {
				znMessage('Error saving folder', 'error');
		});

	};

	// Initialize for Workspace ID
	if ($routeParams.workspace_id) {
		// Set Selected Workspace ID
		$scope.workspaceId = $routeParams.workspace_id;

		// Load Workspace Forms, then Pick First Form
		$scope.loadForms().then(function() {
			if ($scope.forms) {
				$scope.pickForm($scope.forms[0].id);
			}
		});
	}

}])
/**
 * Plugin Registration
 */
.register('namespacedRecordBoard', {
	route: '/namespacedrecordboard',
	controller: 'namespacedRecordBoardCntl',
	template: 'namespaced-record-board-main',
	title: 'Record Board',
	pageTitle: false,
	fullPage: true,
	topNav: true,
	order: 300,
	icon: 'icon-th-large'
});
