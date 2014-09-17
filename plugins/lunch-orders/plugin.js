/**
 * Plugin Lunch Orders Controller
 */
plugin.controller('namespacedCntl', ['$scope', '$firebase', 'znData', '$routeParams', function ($scope, $firebase, znData, $routeParams) {
	
    var fbRecordRef = new Firebase('__INSERT FIREBASE URL HERE__/foodJoints/' + $routeParams.workspace_id);
    var fbRecord = $firebase(fbRecordRef);
    var fbRecordObj = fbRecord.$asObject();
    
    fbRecordObj.$bindTo($scope, 'foodJoint');
    
    var fbOrdersRef = new Firebase(''__INSERT FIREBASE URL HERE__/orders/' + $routeParams.workspace_id);
    var fbOrders = $firebase(fbOrdersRef);
    
    $scope.orders = fbOrders.$asObject();
    
    $scope.forms = [];
    
    znData('Forms').query({
       'workspace.id': $routeParams.workspace_id 
    }, function(forms){
        $scope.forms = forms;
    });
    
    $scope.user = {};
    
    znData('Users').get({id: 'me'}, function(user){
       $scope.user = user; 
    });
    
    $scope.modifying = false;
    
    $scope.changeFoodJoint = function(){
        $scope.modifying = {chooseForm: true};
    };
    
    $scope.foodJoints = [];
    
    $scope.chooseForm = function(formId){
        znData('FormRecords').query({
           formId: formId 
        }, function(foodJoints){
            $scope.foodJoints = foodJoints;
        });
        $scope.modifying = {chooseFoodJoint: true};
    };
    
    $scope.foodJoint = {};
    
    $scope.chooseFoodJoint = function(newFoodJoint){
        $scope.foodJoint.name = newFoodJoint;
        $scope.modifying = false;
        fbOrders.$remove();
    };
    
    $scope.newOrder = {};
    
    $scope.submitOrder = function(){
        fbOrders.$push({
           order: $scope.newOrder.order,
           email: $scope.user.email
        });
        $scope.newOrder.order = '';
    };

}])

/**
 * Plugin Registration
 */
.register('namespaced', {
	route: '/namespaced',
	controller: 'namespacedCntl',
	template: 'namespaced-main',
	title: 'Lunch Orders Plugin',
	pageTitle: false,
	fullPage: true,
	topNav: true,
	order: 300,
	icon: 'icon-food'
});

