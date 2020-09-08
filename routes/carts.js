const express = require('express');
const cartsRepo = require('../repositories/carts');
const productsRepo = require('../repositories/products');
const cartShowTemplate = require('../views/carts/show');

const router = express.Router();

//Receive post request to add item to cart
router.post('/cart/products', async(req, res) => {
    //Figure out the cart
    let cart;
    if(!req.session.cartId){
        //We dont have a cart, we need to create one
        //and store the cart id on the req.session.cartId property
        cart = await cartsRepo.create({ items: [] });
        req.session.cartId = cart.id;
    } else{
        //we have a cart, get it from the repository
        cart = await cartsRepo.getOne(req.session.cartId);
    }


    //Either increment quantity for existing product
    //OR add new product to the items array
    const existingItem = cart.items.find(item => item.id === req.body.productId);
    if(existingItem){
        //increment quantity and save cart
        existingItem.quantity++;
    } else{
        //add new product id to items array
        cart.items.push({ id: req.body.productId, quantity: 1 });
    }
    await cartsRepo.update(cart.id, {
        items: cart.items
    });

    res.redirect('/cart');
});

//Receive get request to show all items in cart
router.get('/cart', async(req, res) => {
    if(!req.session.cartId){
        return res.redirect('/');
    }

    const cart = await cartsRepo.getOne(req.session.cartId);

    for(let item of cart.items){
        const product = await productsRepo.getOne(item.id);

        item.product = product
    }

    res.send(cartShowTemplate({ items: cart.items }));
});

//Receive post request to delete item from a cart
router.post('/cart/products/delete', async(req, res) => {
    const { itemId } = req.body;
    const cart = await cartsRepo.getOne(req.session.cartId);
    const existingItem = cart.items.find(item => item.id === itemId);

    //if more than one item of same id in cart, decrement quantity
    //else remove cart item completely
    if(existingItem.quantity > 1){
        existingItem.quantity--;
        await cartsRepo.update(cart.id, {
            items: cart.items
        });
        res.redirect('/cart');
    } else{
        const items = cart.items.filter(item => item.id !== itemId);

        await cartsRepo.update(req.session.cartId, { items });

        res.redirect('/cart');
    }

    
});

module.exports = router;