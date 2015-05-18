var stemApp = angular.module('stemApp',[]);

var person = function(id, name, img) {
	this.id = id;
	this.name = name;
	this.picture = 'images/' + img;
	this.department = 'Department';
	this.description = 'Jon loves to longboard, ride fixie, and drive stick because, as he says, the journey is just as important as the destination.';
	this.social = 'https://facebook.com/FredJeong';
	this.cover = '';
}

stemApp.controller('memberList', function($scope) {
	$scope.members = [
		new person(0, 'Audi','1.jpg'),
		new person(1, 'Boison','2.jpg'),
		new person(2, 'Twitter	','3.jpg'),
		new person(3, 'Dan','4.jpg'),
		new person(4, 'Taylor','5.jpg'),
		new person(5, 'Jieun','6.jpg'),
		new person(6, 'Suzi','7.jpg')];
	$scope.pIndex = 0;
	$scope.openCard = function(id) {openCard($scope, id);};
});

function openCard($scope, id) {
	$scope.pIndex = id;
	$(".member-card").trigger('openModal');
}