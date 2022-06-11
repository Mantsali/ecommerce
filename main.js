const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: Keys.space,
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: Keys.accessToken
  });



const cartButton = document.querySelector(".cart-btn");
const clearCartBtn = document.querySelector(".clear-cart");
const productDom = document.querySelector(".products-content")
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total"); 
const cartContent = document.querySelector(".cart-content");
const privacyBtn = document.querySelector('.privacy-policy button');
const cartModal = new bootstrap.Modal(document.getElementById("cartModal"), {});

//cart
let cart = [];
//cart buttons
let cartButtonsDom = [];


//get products
class Products{
    async getProducts(){
       try {

        let contentful = await client.getEntries({
            content_type: "electronicGoods"
        });


        let results = await fetch('products.json');
        let data = await results.json();

        //let products = data.items;
        let products = contentful.items;
        
        products = products.map(item => {
            const {title, price} = item.fields;
            const {id} = item.sys;
            const image = item.fields.image.fields.file.url;

            return {title, price, id, image}
        })
        return products;
       } catch(error){
           console.log(error);
       }
        
    }

}
//display products
class ProductUI{
    displayProducts(products){
        console.log(products);
        let result = '';
        products.forEach(product => {
            result += `
            <div class="col">
                  <div class="card h-100">
                    <img src=${product.image} class="card-img-top" alt="...">
                    <div class="card-body">
                      <h5 class="card-title">${product.title}</h5>
                      <p class="card-text">${product.price}</p>
                    </div>
                    <div class="product-button">
                    <button class="bag-btn btn btn-dark" data-id=${product.id}>
                        <i class="fa-solid fa-cart-shopping "></i>
                    </button>
                    <button class="heart  -btn btn btn-dark" data-id=${product.id}>
                        <i class="fa-solid fa-heart"></i>
                    </button>
                </div>
                  </div>
                </div>
                `;
        });
        productDom.innerHTML = result;         
    }

    getBagButtons() {
        const bagButtons = [...document.querySelectorAll(".bag-btn")];
        cartButtonsDom = bagButtons;

        bagButtons.forEach(button => {
            let id = button.dataset.id;
            
            let inCart = cart.find(item => item.id === id);
            if(inCart){
                button.innerText = "In Cart";
                button.disabled = true;
            } 
                button.addEventListener("click", event => {
                    event.target.innerText = "In Cart";
                    event.target.disabled = true

                    //get product from products
                    let cartItem = {...Storage.getProduct(id), amount: 1};

                    //add product to the cart
                    cart = [...cart, cartItem];
                    //save cart in local storage
                    Storage.saveCart(cart);
                    //set cart values
this.setCartValue(cart);
                    //display cart item
                    this.addCartItem(cartItem);
                    //show the cart
                    cartModal.show();
                });
            
        });

        
    }
    setCartValue(cart){
            let tempTotal = 0;
            let itemstotal =0;

            cart.map(item => {
                tempTotal += item.price * item.amount;
                itemstotal += item.amount;
            });

            cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
            cartItems.innerText =itemstotal;
        }
        
    addCartItem(item){
        const div =document.createElement("div");
        div.classList.add('cart-item');
        div.innerHTML = ` <img src=${item.image} alt="">
        <div>
          <h4>${item.title}</h4>
          <h5>R${item.price}</h5>
          <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
            <i class="fa-solid fa-chevron-up" data-id=${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fa-solid fa-chevron-down" data-id=${item.id}></i>
        </div>`;
        cartContent.appendChild(div);
    }
    
    setupApp(){
    cart = Storage.getCart();
    this.setCartValue(cart);
    this.poppulateCart(cart);
    this.cartLogic();
    }

    poppulateCart(cart){
        cart.forEach(item => this.addCartItem(item));
    }

    cartLogic(){
        clearCartBtn.addEventListener("click", () => this.clearCart());
        //cart functionality
        cartContent.addEventListener("click", event => {
            if(event.target.classList.contains("remove-item")){
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement);
                this.removeItem(id);
            } else if(event.target.classList.contains("fa-chevron-up")){
                let addAmount = event.target;
                let id = addAmount.dataset.id;

                let tempItem = cart.find(item => item.id === id);

                tempItem.amount = tempItem.amount+ 1;
                Storage.saveCart(cart);
                this.setCartValue(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            } else if(event.target.classList.contains("fa-chevron-down")){
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;

                let tempItem = cart.find(item => item.id === id);

                tempItem.amount = tempItem.amount - 1;
                if(tempItem.amount > 0){
                    Storage.saveCart(cart);
                    this.setCartValue(cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                }else{
                cartContent.removeChild(lowerAmount.parentElement.parentElement);
                this.removeItem(id);
                }

                
            }
        })

    }
    clearCart(){
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id))
        while(cartContent.children.length > 0){
            cartContent.removeChild(cartContent.children[0]);
        }
    }
    removeItem(id){
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fa-solid fa-cart-shopping "></i>`;
    }

    getSingleButton(id){
        return cartButtonsDom.find(button => button.dataset.id === id);
    }
}

//storage
class Storage {
    static saveProducts(products){
        localStorage.setItem("products", JSON.stringify(products));
    }

    static getProduct(id){
        let products = JSON.parse(localStorage.getItem("products"));
        return products.find( product => product.id === id);
    }

    static saveCart(cart){
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    static getCart(){
        return localStorage.getItem('cart')?JSON.parse(localStorage.getItem('cart')):[];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ui = new ProductUI();
    const products = new Products();


    ui.setupApp()
    //get all products
    products.getProducts().then(data => {
        ui.displayProducts(data);
        Storage.saveProducts(data);
    }).then( ()=> {
        ui.getBagButtons();
    });
});



//remove privacy policy popup
privacyBtn.addEventListener('click', () => {
    console.log("hide");
    document.querySelector('.privacy-policy').classList.add('hide');
});