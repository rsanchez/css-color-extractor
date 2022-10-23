var $ = jQuery = require('jquery');
var Color = require('color');

require('bootstrap');

$(function() {
    function showColors(colors) {
        $('#colors').html('');

        for (var i = 0; i < colors.length; i++) {
            var color = new Color(colors[i]);
            var textColor = color.dark() ? '#FFF' : '#000';
            $('#colors').append('<div class="panel panel-default"><div class="panel-body" style="background-color: '+colors[i]+'; color: '+textColor+';">'+colors[i]+'</div></div>');
        }

        resetForm();
    }

    function resetForm() {
        $('#extractor-form').removeClass('loading');

        $('#extractor-form').find('[type=submit]').button('reset');
    }

    function showError(error) {
        $('#error').html('<div class="alert alert-danger" role="alert">'+(error.message || error)+'</div>');

        resetForm();
    }

    function extractColorsFromCss(css) {
        if (!css) {
            return showError('Empty css');
        }

        var options = {
            withoutGrey: $('#without-grey-input').is(':checked'),
            withoutMonochrome: $('#without-monochrome-input').is(':checked'),
            colorFormat: $('#color-format-input').val() || null
        };

        try {
            var colors = require('css-color-extractor').fromCss(css, options);
        } catch (e) {
            return showError(e);
        }

        showColors(colors);
    }

    function extractColorsFromFileInput(fileInput) {
        if (!fileInput.files || typeof fileInput.files[0] === 'undefined') {
            $('#extractor-form').find('drag-n-drop-placeholder').html('Drop CSS file here or click to browse');
            return showError('Missing file');
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function(event) {
            extractColorsFromCss(event.target.result);
        };

        reader.readAsText(fileInput.files[0]);
    }

    function extractColorsFromRemoteFile(url) {
        if (!url) {
            return showError('Missing url');
        }

        $.ajax({
            url: 'https://proxy.cors.sh/' + url,
            dataType: 'text',
            success: extractColorsFromCss,
            error: function(xhr, textStatus) {
                if (textStatus === 'timeout') {
                    showError('Operation timed out.');
                } else {
                    showError(xhr.responseText);
                }
            },
            timeout: 30000
        });
    }

    function trackFormSubmitEvent(label) {
        if (typeof 'ga' !== 'undefined') {
            ga('send', 'event', 'Form', 'submit', label);
        }
    }

    $('#extractor-form').on('submit', function(e) {
        var $form = $(this);
        var $tab = $form.find('.tab-pane.active');
        var tabId = $tab.attr('id');
        var $button = $form.find('[type=submit]');

        e.preventDefault();

        $('#error').html('');

        $form.addClass('loading');

        $button.button('loading');

        switch (tabId) {
            case 'paste-css':
                extractColorsFromCss($('#paste-css-input').val());

                trackFormSubmitEvent('paste');

                break;
            case 'upload-css':
                extractColorsFromFileInput(document.getElementById('upload-css-input'));

                trackFormSubmitEvent('upload');

                break;
            case 'url-to-css':
                extractColorsFromRemoteFile($('#url-to-css-input').val());

                trackFormSubmitEvent('url');

                break;
        }
    });

    $('#upload-css-input').on('change', function() {
        var $input = $(this);
        var filename = $input.val().split('\\').pop();
        var $placeholder = $input.closest('.drag-n-drop').find('.drag-n-drop-placeholder');

        $placeholder.html(filename);

        $('#extractor-form').submit();
     }).on('dragenter', function() {
        $(this).closest('.drag-n-drop').addClass('bg-info');
     }).on('drop dragleave', function() {
        $(this).closest('.drag-n-drop').removeClass('bg-info');
     });
});