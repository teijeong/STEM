$(".member-card").easyModal({
	top: 200,
	overlay:0.2
});

function closeModal() {
	$(".member-card").trigger("closeModal");
}