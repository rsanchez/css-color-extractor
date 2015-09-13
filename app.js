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
    }

    function showError(error) {
        $('#colors').html('<div class="alert alert-danger" role="alert">'+(error.message || error)+'</div>');
    }

    $('#paste-css').find('form').on('submit', function(e) {
        e.preventDefault();

        try {
            var colors = require('css-color-extractor').fromCss($(this).find('textarea').val());
        } catch (e) {
            showError(e);
        }

        showColors(colors);
    });

    function showColorsFromCssFile() {
        var files = document.getElementById('upload-css-input').files;
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function(event) {
            var css = event.target.result;
            var colors = [];
            try {
                colors = colors.concat(require('css-color-extractor').fromCss(css));
            } catch (e) {
                showError(e);
            }

            showColors(colors);
        };

        for (var i = 0; i < files.length; i++) {
            // Read in the image file as a data URL.
            reader.readAsText(files[i]);
        }
    }

    $('#upload-css').find('form').on('submit', function(e) {
        e.preventDefault();
        showColorsFromCssFile();
    });

    $('#upload-css-input').on('change', function() {
        var $input = $(this);
        var filename = $input.val().split('\\').pop();
        var $placeholder = $input.closest('.drag-n-drop').find('.drag-n-drop-placeholder');

        $placeholder.html(filename);

        showColorsFromCssFile();
     });

    $('#url-to-css').find('form').on('submit', function(e) {
        var $form = $(this);
        var url = $form.find(':input').val();

        $form.addClass('loading');

        e.preventDefault();

        if (!url) {
            $form.removeClass('loading');
            alert('Missing url');
            return;
        }

        $.ajax({
            url: 'https://css-color-extractor.herokuapp.com/',
            data: {
                url: url
            },
            dataType: 'text',
            success: function(data) {
                try {
                    var colors = require('css-color-extractor').fromCss(data);
                } catch (e) {
                    showError(e);
                }

                $form.removeClass('loading');
                showColors(colors);
            },
            error: function(xhr) {
                $form.removeClass('loading');
                alert(xhr.responseText);
            }
        });
    });
});