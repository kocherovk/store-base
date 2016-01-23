function ShowProductModal() {
    var $showModal = $('.show-product-modal'),
        ShowUIModal = UI.Modal.create($showModal, {centerY: true}),
        buyCounter = UI.Counter.create($showModal.find('#buy-counter')),
        $slider = $showModal.find('.slider'),
        $sliderNav = $showModal.find('.slider-nav'),
        slider = undefined,
        sliderNav = undefined;

    var $buyGroup   = $showModal.find('.buy-menu'),
        $orderGroup = $showModal.find('.order-menu'),
        flag = 0;

    $showModal.find('.modal-switch').click(function() {
        if (flag = (flag + 1) % 2) {
            $buyGroup.addClass('hide');
            $orderGroup.removeClass('hide');
        }
        else {
            $buyGroup.removeClass('hide');
            $orderGroup.addClass('hide');
        }
    });

    function buyBtnClicked() {
        var $this = $(this);
        $this.text('Спасибо! Товар добавлен в корзину');

    }
    function tags(product) {
        function categoryTag(cat) {
            if (cat.special) return specialTag(cat);
            return "<a href='/store/" + cat.name + "' class = 'tag'>" + cat.name + "</a>";
        }

        function collectionTag(col) {
            return "<a href='/store/collections/" + col.id + "' class = 'collection'>" + col.name + "</a>";
        }

        function specialTag(spe) {
            return "<a href='/store/specials/" + spe.special_id + "' class = 'special'>" + spe.name + "</a>";
        }

        var result = '';

        if (product.tags)
            result = product.tags.map( categoryTag ).join('');
        if (product.category)
            result += collectionTag(product.category);

        return result;
    }

    function initSlider(product) {
        $slider.slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            fade: true,
            asNavFor: '.slider-nav'
        });
        $slider.addClass('full-height');
        sliderNav = undefined;

        if (product.images.length > 1) {
            $slider.removeClass('full-height');

            $sliderNav.slick({
                slidesToShow: 5,
                slidesToScroll: 1,
                asNavFor: '.slider',
                dots: false,
                centerMode: true,
                focusOnSelect: true
            });
            sliderNav = $sliderNav.slick('getSlick');
        }

        slider = $slider.slick('getSlick');
    }

    function fillSlider(product) {
        slider.unslick();

        if (sliderNav)
            sliderNav.unslick();

        function imageHtml(url) {
            return '<div><img src = "'+ url +'"></div>';
        }

        $slider.empty();
        $sliderNav.empty();

        product.images.forEach(function(image) {
            var imageTag = imageHtml(image.file.regular.url),
                thumbTag = imageHtml(image.file.thumb.url);
            $slider.append(imageTag);
            if (product.images.length > 1)
                $sliderNav.append(thumbTag);
        });

        initSlider(product);
        setTimeout(function () {
            slider.setPosition();
            if (sliderNav)
                sliderNav.setPosition();
        }, 0)
    }

    function prepare(product) {
        if (slider == undefined) {
            initSlider(product);
        }

        fillSlider(product);
        $showModal.find('.open-modal[data-modal="product-buy"]').attr('data-arg', product.id);
        $showModal.find('.modal-product-name .name').text(product.name);
        $showModal.find('.link.open-modal').attr('data-arg', product.id);
        $showModal.find('.amount-info span').text(product.stock);
        $showModal.find('.price').text(product.price);
        $showModal.find('.more-amount').data('target', '.cart-counter-' + product.id);

        if (product.description.length > 0)
            $showModal.find('.description').text(product.description);
        else
            $showModal.find('.description').text('');

        if (product.stock > 0) {
            $showModal.find('.empty-stock-message').addClass('hide');
            $showModal.find('.stock-message').removeClass('hide');
        }
        else {
            $showModal.find('.empty-stock-message').removeClass('hide');
            $showModal.find('.stock-message').addClass('hide');
        }

        $showModal.find('.less-amount').data('target', '.cart-counter-' + product.id);
        $showModal.find('.amount-counter').addClass('cart-counter-' + product.id).text(1);

        var $buyBtn = $showModal.find('.buy-button');

        $buyBtn.off('ajax:beforeSend').on('ajax:beforeSend', addAmountToRequest(buyCounter));
        $buyBtn.off('ajax:success').on('ajax:success', buyBtnClicked);
        $buyBtn[0].search = "?id=" + product.id + '&type=stocked';
        $buyBtn.text('Купить');

        if (product.stock > 0) {
            buyCounter.config({max: product.stock});
        }

        buyCounter.reset();
        $showModal.find('.product-tags').html(tags(product));
    }

    function addAmountToRequest(counter) {
        return function(_, request, options) {
            options.url += '&amount=' + counter.val();
            if (counter.val() == 0)
                request.abort();
        }
    }

    function hide() {
        if (!ShowUIModal.visible()) return;
        ShowUIModal.hide();
    }

    var showModal = {
        show: function(product) {
            if (typeof(product) != "object" && typeof(+product) == "number")
                Products.get(product).done(function(product) {
                    prepare(product);
                    ShowUIModal.show();

                    if (location.pathname != Products.path(product)) {
                        history.pushState(location.pathname, null, Products.path(product));
                    }
                });

        },

        visible: function() {
            return ShowUIModal.visible();
        },

        hide: hide
    };

    return showModal;
}