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

const fillRowWithData = (training_appendices_arr) => {
  for (var k in training_appendices_arr) {
    let index = k;
    const filenamePart = training_appendices_arr[k].split(",")[0];
    const fileNameArr = filenamePart.split("/");
    let filename = fileNameArr[fileNameArr.length - 1];
    let description = training_appendices_arr[k].split(",")[1];
    const row = `<tr>
                     <td>${index}</td>
                     <td><a href="${filenamePart}" target="_blank" class="file_link">${filename}</a></td>
                      <td>${description}</td></tr>
                 `;
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
              alert('Data Submitted Successfully!');
              $("#dialog_table").dialog("close");
            },
            error: (e) => {
              alert('Data Submission Error! Please Try Again Later! ');
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
