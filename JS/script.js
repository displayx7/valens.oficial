const WHATSAPP_NUMBER = '5551998361451';
const CART_STORAGE_KEY = 'valens-cart';

const cartToggle = document.querySelector('.cart-toggle');
const cartClose = document.querySelector('.cart-close');
const cartOverlay = document.querySelector('[data-cart-overlay]');
const cartItemsContainer = document.querySelector('[data-cart-items]');
const cartCount = document.querySelector('[data-cart-count]');
const cartTotal = document.querySelector('[data-cart-total]');
const checkoutForm = document.querySelector('[data-checkout-form]');
const addButtons = document.querySelectorAll('.add-to-cart');

let cart = loadCart();

function loadCart(){
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if(!savedCart){
        return [];
    }

    try{
        const savedItems = JSON.parse(savedCart);

        if(!Array.isArray(savedItems)){
            return [];
        }

        return savedItems.map((item) => {
            const currentPrice = getVisibleProductPrice(item.name);

            return {
                ...item,
                price:currentPrice ?? item.price
            };
        });
    }catch(error){
        return [];
    }
}

function saveCart(){
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function formatCurrency(value){
    return value.toLocaleString('pt-BR', {
        style:'currency',
        currency:'BRL'
    });
}

function parseCurrency(value){
    return Number(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

function parseProductPrice(card){
    const priceElement = card.querySelector('.product-price') || card.querySelector('.card-footer span');
    const priceText = priceElement?.textContent || card.dataset.productPrice || '';
    const price = parseCurrency(priceText);

    return Number.isFinite(price) ? price : null;
}

function getVisibleProductPrice(productName){
    const productCard = Array.from(document.querySelectorAll('.card')).find((card) => {
        return card.dataset.productName === productName;
    });

    if(!productCard){
        return null;
    }

    return parseProductPrice(productCard);
}

function openCart(){
    document.body.classList.add('cart-open');
}

function closeCart(){
    document.body.classList.remove('cart-open');
}

function getCartTotal(){
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getCartCount(){
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function renderCart(){
    cartItemsContainer.innerHTML = '';

    if(cart.length === 0){
        cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio.</p>';
    }

    cart.forEach((item) => {
        const cartItem = document.createElement('article');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <h3>${item.name}</h3>
            <p>${formatCurrency(item.price)} cada</p>
            <div class="cart-item-actions">
                <div class="quantity-control" aria-label="Quantidade de ${item.name}">
                    <button type="button" data-decrease="${item.name}" aria-label="Diminuir quantidade">-</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-increase="${item.name}" aria-label="Aumentar quantidade">+</button>
                </div>
                <button class="remove-item" type="button" data-remove="${item.name}">Remover</button>
            </div>
        `;

        cartItemsContainer.appendChild(cartItem);
    });

    cartCount.textContent = getCartCount();
    cartTotal.textContent = formatCurrency(getCartTotal());
    checkoutForm.querySelector('button').disabled = cart.length === 0;
    saveCart();
}

function addToCart(product){
    const itemInCart = cart.find((item) => item.name === product.name);

    if(itemInCart){
        itemInCart.quantity += 1;
    }else{
        cart.push({
            ...product,
            quantity:1
        });
    }

    renderCart();
    openCart();
}

function changeQuantity(productName, quantityChange){
    const itemInCart = cart.find((item) => item.name === productName);

    if(!itemInCart){
        return;
    }

    itemInCart.quantity += quantityChange;

    if(itemInCart.quantity <= 0){
        cart = cart.filter((item) => item.name !== productName);
    }

    renderCart();
}

function removeItem(productName){
    cart = cart.filter((item) => item.name !== productName);
    renderCart();
}

function buildOrderMessage(customer){
    const productLines = cart.map((item) => {
        const itemTotal = formatCurrency(item.price * item.quantity);
        return `- ${item.quantity}x ${item.name} | ${itemTotal}`;
    }).join('\n');

    return [
        'Olá, Valens! Quero finalizar este pedido:',
        '',
        productLines,
        '',
        `Total: ${formatCurrency(getCartTotal())}`,
        '',
        `Nome: ${customer.name}`,
        `WhatsApp: ${customer.phone}`,
        `Pagamento escolhido: ${customer.payment}`
    ].join('\n');
}

addButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const card = button.closest('.card');
        const price = parseProductPrice(card);

        if(!card.dataset.productName || price === null){
            return;
        }

        const product = {
            name:card.dataset.productName,
            price
        };

        addToCart(product);
    });
});

cartItemsContainer.addEventListener('click', (event) => {
    const increaseButton = event.target.closest('[data-increase]');
    const decreaseButton = event.target.closest('[data-decrease]');
    const removeButton = event.target.closest('[data-remove]');

    if(increaseButton){
        changeQuantity(increaseButton.dataset.increase, 1);
    }

    if(decreaseButton){
        changeQuantity(decreaseButton.dataset.decrease, -1);
    }

    if(removeButton){
        removeItem(removeButton.dataset.remove);
    }
});

checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if(cart.length === 0){
        openCart();
        return;
    }

    const formData = new FormData(checkoutForm);
    const customer = {
        name:formData.get('name').trim(),
        phone:formData.get('phone').trim(),
        payment:formData.get('payment')
    };

    const message = encodeURIComponent(buildOrderMessage(customer));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
});

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', (event) => {
    if(event.key === 'Escape'){
        closeCart();
    }
});

renderCart();
