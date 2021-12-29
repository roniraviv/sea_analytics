const clearDataRows = () => {
  $("#dialog_table_tr tr:gt(0)").remove();
}

const clearWholeTableTr = () => {
  $("#dialog_table_tr tr:first-child").hide()
  $("#dialog_table_header").hide()
}

const showWholeTableTr = () => {
  $("#dialog_table_tr tr:first-child").show()
  $("#dialog_table_header").show()
}

const fillRowWithData = (training_id, training_appendices_arr, del_url, originator, is_staff) => {
  for (var k in training_appendices_arr) {
    let index = k;
    const filenamePart = training_appendices_arr[k].split(",")[0];
    const fileNameArr = filenamePart.split("/");
    let filename = fileNameArr[fileNameArr.length - 1];
    let description = training_appendices_arr[k].split(",")[1];
    let owner = training_appendices_arr[k].split(",")[2];
    let row = ``
    if ((owner == originator) || (is_staff == 'True')) {
        row = `<tr>
                  <td>${index}</td>
                  <td><a href="${filenamePart}" target="_blank" class="file_link">${filename}</a></td>
                  <td>${description}</td>
                  <td><a href="#" onclick='delete_appendix("${training_id}", ${k}, "${del_url}");'>X</a></td>
              </tr>
              `;
    }
    else {
        row = `<tr>
                  <td>${index}</td>
                  <td><a href="${filenamePart}" target="_blank" class="file_link">${filename}</a></td>
                  <td>${description}</td>
                  <td></td>
              </tr>
              `;
    }
    $(" #dialog_table_tr").append(row);
  }
}

const cleanFormData = () => {
  $("#file").val(null);
  $("#description").val("");
}

const defineDialog = ({trainingId, url}) => {
  $("#dialog_table").dialog({
    autoOpen: false,
    closeOnEscape: false,
    width: '30%',
    beforeClose: cleanFormData,
    show: {
      effect: "blind",
      duration: 300
    },
    hide: {
      effect: "explode",
      duration: 100
    },
    buttons: [
      {
        text: "Ok",
        id: "ok_button",
        click: function () {

          const formData = new FormData();
          var csrftoken = $("[name=csrfmiddlewaretoken]").val();
          formData.append('file', $("#file")[0].files[0]);
          formData.append('description', $("#description").val());
          formData.append('training_id', trainingId);
          formData.append('csrfmiddlewaretoken', csrftoken);

          $.ajax({
            url,
            type: 'POST',
            cache: false,
            contentType: false,
            processData: false,
            data: formData,
            success: () => {
              $("#dialog_table").dialog("close");
              location.reload();
            },
            error: (e) => {
              swal("Training Appendices", 'Appendix Submission Failed! Please Try Again Later!', "error");
              $("#dialog_table").dialog("close");
            }
          });
        }
      }
    ]
  });
}

const disableSubmitButton = () => {
  changeButtonProps.disabled()
}

const showDialog = () => {
  $("#dialog_table").dialog("open");
}

const validateDialog = () => {
  $("#description").on('keyup', (e) => {
    if (e.target.value !== "" && $("#file")[0].files[0] !== undefined) {
      changeButtonProps.enabled();
      return;
    }
    changeButtonProps.disabled()
  })
  $("#file").on('change', (e) => {
    if (e.target.files !== undefined && $("#description").val() !== "") {
      changeButtonProps.enabled();
      return;
    }
    changeButtonProps.disabled();
  })
}

const changeButtonProps = {
  disabled: () => $("#ok_button").attr('disabled', 'disabled')
    .css({'background': 'silver', 'color': 'black'})
  ,
  enabled: () => $("#ok_button").removeAttr('disabled')
    .css({'background': 'green', 'color': 'white'})
}

function delete_appendix(training_id, appendix_id, del_url) {
  $.ajax({
      url: del_url,
      data: { appendix_id: appendix_id,
              training_id: training_id },
      success: function() { location.reload(); },
      error: function() { swal("Training Appendices", 'Appendix Removal Error! Please Try Again Later!', "error"); },
  });
}
