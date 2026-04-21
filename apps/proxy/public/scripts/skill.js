$(document).ready(function () {});

function getUsername() {
  const user = $('input#username').first()[0];
  return user.value;
}

function getSkillName() {
  const skill_name = $('div#skill').first()[0];
  return skill_name.innerText;
}

$('a.intent').click(function (evt) {
  const target = evt.target;
  $.ajax({
    url: getSkillName() + '/' + target.id,
    dataType: 'html',
    data: {
      user: getUsername(),
    },
  }).fail(function (jqXMR, textStatus) {
    console.log('Ajax request failed: ' + textStatus);
    $('h5#pugModalTitle').html('Command Failed (' + jqXMR.status + ')');
    $('#pugModalBody').html('<p>' + jqXMR.responseText + '</p>');
    $('#pugModal').modal('show');
  });
});
