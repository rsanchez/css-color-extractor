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
        var $form = $(this);

        e.preventDefault();

        var options = {
            withoutGrey: $form.find("[name=without-grey]").is(":checked"),
            withoutMonochrome: $form.find("[name=without-monochrome]").is(":checked")
        };

        var css = $form.find('textarea').val();

        try {
            var colors = require('css-color-extractor').fromCss(css, options);
        } catch (e) {
            showError(e);
        }

        showColors(colors);
    });

    $('#upload-css').find('form').on('submit', function(e) {
        var $form = $(this);

        e.preventDefault();

        var files = document.getElementById('upload-css-input').files;
        var reader = new FileReader();

        var options = {
            withoutGrey: $form.find("[name=without-grey]").is(":checked"),
            withoutMonochrome: $form.find("[name=without-monochrome]").is(":checked")
        };

        // Closure to capture the file information.
        reader.onload = function(event) {
            var css = event.target.result;
            var colors = [];
            try {
                colors = colors.concat(require('css-color-extractor').fromCss(css, options));
            } catch (e) {
                showError(e);
            }

            showColors(colors);
        };

        for (var i = 0; i < files.length; i++) {
            // Read in the image file as a data URL.
            reader.readAsText(files[i]);
        }
    });

    $('#upload-css-input').on('change', function() {
        var $input = $(this);
        var filename = $input.val().split('\\').pop();
        var $placeholder = $input.closest('.drag-n-drop').find('.drag-n-drop-placeholder');

        $placeholder.html(filename);

        $('#upload-css').submit();
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

        var options = {
            withoutGrey: $form.find("[name=without-grey]").is(":checked"),
            withoutMonochrome: $form.find("[name=without-monochrome]").is(":checked")
        };

        $.ajax({
            url: 'https://css-color-extractor.herokuapp.com/',
            data: {
                url: url
            },
            dataType: 'text',
            success: function(css) {
                try {
                    var colors = require('css-color-extractor').fromCss(css, options);
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