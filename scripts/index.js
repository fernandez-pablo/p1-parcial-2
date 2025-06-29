// --- defino la Clase Producto ---
class Producto {
    constructor(id, nombre, precio, imagen, descripcion, categoria) {
        this.id = id;
        this.nombre = nombre;
        this.precio = precio;
        this.imagen = imagen;
        this.descripcion = descripcion;
        this.categoria = categoria;
    }
    // visto en las ultimas clasesas  el atributo "data-id" datos personalizados (data attributes) almaceno info en el elemento HTML
    toHTML() {
        return `
            <img src="${this.imagen}" alt="${this.nombre}">
            <h3>${this.nombre}</h3>
            <p>${this.categoria}</p>
            <p><b>Precio: $${this.precio.toFixed(3)}</b></p>
            <button class="btn btn-pipo btn-agregar-carrito" data-id="${this.id}">Agregar al Carrito</button>
            <button class="btn btn-info btn-ver-mas" data-id="${this.id}">Ver Más</button>
        `;
    }
}

// -- defino de la Clase Carrito ---
class Carrito {
    constructor() {
        this.items = [];
        this.loadFromLocalStorage();
    }
    // levanto la data del local storage
    loadFromLocalStorage() {
        const storedCart = localStorage.getItem('carritoCompras');
        if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            this.items = parsedCart.map(item => ({
                producto: new Producto(item.producto.id, item.producto.nombre, item.producto.precio, item.producto.imagen, item.producto.descripcion, item.producto.categoria),
                cantidad: item.cantidad,
                subtotal: item.subtotal
            }));
        }
    }
    // guardo en local storage pasandolo a un string
    saveToLocalStorage() {
        localStorage.setItem('carritoCompras', JSON.stringify(this.items));
    }

    agregarProducto(productoNuevo) {
        const itemExistente = this.items.find(item => item.producto.id === productoNuevo.id);

        if (itemExistente) {
            itemExistente.cantidad++;
            itemExistente.subtotal = itemExistente.producto.precio * itemExistente.cantidad;
        } else {
            this.items.push({
                producto: productoNuevo,
                cantidad: 1,
                subtotal: productoNuevo.precio
            });
        }
        this.saveToLocalStorage();
    }

    eliminarProducto(productId) {
        this.items = this.items.filter(item => item.producto.id !== productId);
        this.saveToLocalStorage();
    }
    // metodos para sumar y restar productos
    cambiarCantidad(productId, operacion) {
        const itemExistente = this.items.find(item => item.producto.id === productId);

        if (itemExistente) {
            if (operacion === 'sumar') {
                itemExistente.cantidad++;
            } else if (operacion === 'restar') {
                itemExistente.cantidad--;
            }

            if (itemExistente.cantidad <= 0) {
                this.eliminarProducto(productId);
                return;
            }

            itemExistente.subtotal = itemExistente.producto.precio * itemExistente.cantidad;
        }
        this.saveToLocalStorage();
    }
    ////contadores del carrito
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.cantidad, 0);
    }

    getTotalPagar() {
        return this.items.reduce((total, item) => total + item.subtotal, 0);
    }

    getItems() {
        return this.items;
    }

    estaVacio() {
        return this.items.length === 0;
    }
}

// --- Creo carrito  y Datos Iniciales ---
let productosDisponibles = [];
let productosFiltradosOrdenados = []; // variable para almacenar los productos después de filtrar y ordenar
const miCarrito = new Carrito();

// --- acaá guardo las referencias a  elementos del DOM ---
const productosContainer = document.getElementById('productos-container');

// Referencias para la barra superior
const totalResumenElement = document.getElementById('total-resumen');
const itemCountElement = document.getElementById('item-count');

// Referencias a las modales
const carritoModal = document.getElementById('carrito-modal');
const detalleProductoModal = document.getElementById('detalle-producto-modal');

// Botoncito para abrir la modal del carrito
const verCarritoBtn = document.getElementById('toggleCarritoBtn');

// --- guardo las referencias para los filtros de categoria y precio ---
const selectCategoria = document.getElementById('select-categoria');
const selectOrdenPrecio = document.getElementById('select-orden-precio');


// ---  creo los elementos html  relacion con la clase Carrito ---
function renderizarProductos(productosARenderizar) {
    productosContainer.innerHTML = '';
    productosARenderizar.forEach(producto => {
        const productoDiv = document.createElement('div');
        productoDiv.classList.add('producto');
        productoDiv.innerHTML = producto.toHTML();
        productosContainer.appendChild(productoDiv);
    });
    // capturo el evento click del boton agregar al carrito
    document.querySelectorAll('.producto .btn-agregar-carrito').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.target.dataset.id);
            const productoToAdd = productosDisponibles.find(p => p.id === productId);
            if (productoToAdd) {
                miCarrito.agregarProducto(productoToAdd);
                actualizarVistaCarrito();
            }
        });
    });
    // capturo el evento click del boton ver mas detalles del producto en la modal
    document.querySelectorAll('.producto .btn-ver-mas').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.target.dataset.id);
            const productoToShow = productosDisponibles.find(p => p.id === productId);
            if (productoToShow) {
                mostrarDetalleProductoModal(productoToShow);
            }
        });
    });
}

function actualizarVistaCarrito() {
    if(itemCountElement) {
        itemCountElement.textContent = miCarrito.getTotalItems();
    }
    if(totalResumenElement) {
        totalResumenElement.textContent = `Total: $${miCarrito.getTotalPagar().toFixed(3)}`;
    }
    // aca si el contenedor carritoModal tiene la clase visible, lo muestro
    if (carritoModal.classList.contains('visible')) {
        renderizarContenidoCarritoModal();
    }
}

// --- Mostrar/Ocultar Carrito modal ---

//Si el modal nno esta visible, No necesita actualizar su contenido 
//si esta VISIBLE, si renderiza el contenido
function toggleCarritoModal() {
    // .toggle funciona alternando la clase visible
    carritoModal.classList.toggle('visible');
    if (carritoModal.classList.contains('visible')) {
        renderizarContenidoCarritoModal();
    }
}
/// creo los elemntos del carito modal
function renderizarContenidoCarritoModal() {
    //firstChild accede al primer  hijo
    //removeChild elimina ese hijo
    //el bucle  continúa hasta que no quedan hijos asi se hace desde cero cada vez que actualiza
    while (carritoModal.firstChild) {
        carritoModal.removeChild(carritoModal.firstChild);
    }

    const modalContentDiv = document.createElement('div');
    modalContentDiv.classList.add('modal-content');
    // creo el boton con un span para cerrr el carrito
    const closeButton = document.createElement('span');
    closeButton.classList.add('close-button');
    closeButton.textContent = '×';
    // le agrego el listener para la funcion ver/ocultar modal con el toggle
    closeButton.addEventListener('click', toggleCarritoModal);
    modalContentDiv.appendChild(closeButton);

    const h2Title = document.createElement('h2');
    h2Title.textContent = 'Tu Carrito de Compras';
    modalContentDiv.appendChild(h2Title);

    const listaCarritoUl = document.createElement('ul');
    listaCarritoUl.id = 'lista-carrito';

    if (miCarrito.estaVacio()) {
        const emptyLi = document.createElement('li');
        emptyLi.textContent = 'El carrito está vacío.';
        listaCarritoUl.appendChild(emptyLi);
    } else {
        miCarrito.getItems().forEach(item => {
            const li = document.createElement('li');

            const divProductoInfo = document.createElement('div');
            divProductoInfo.textContent = item.producto.nombre;

            const divCantidadControles = document.createElement('div');
            divCantidadControles.classList.add('cantidad-controles');

            const btnRestar = document.createElement('button');
            btnRestar.classList.add('restar');
            btnRestar.textContent = '-';
            btnRestar.setAttribute('data-id', item.producto.id);
            btnRestar.addEventListener('click', (event) => {
                const id = parseInt(event.target.dataset.id);
                miCarrito.cambiarCantidad(id, 'restar');
                renderizarContenidoCarritoModal();
                actualizarVistaCarrito();
            });
            divCantidadControles.appendChild(btnRestar);

            const spanCantidad = document.createElement('span');
            spanCantidad.textContent = item.cantidad;
            divCantidadControles.appendChild(spanCantidad);

            const btnSumar = document.createElement('button');
            btnSumar.classList.add('sumar');
            btnSumar.textContent = '+';
            btnSumar.setAttribute('data-id', item.producto.id);
            btnSumar.addEventListener('click', (event) => {
                const id = parseInt(event.target.dataset.id);
                miCarrito.cambiarCantidad(id, 'sumar');
                renderizarContenidoCarritoModal();
                actualizarVistaCarrito();
            });
            divCantidadControles.appendChild(btnSumar);

            divProductoInfo.appendChild(divCantidadControles);

            const divImgChiquita = document.createElement('div');
            divImgChiquita.classList.add('img-chiquita');
            const imgChiquita = document.createElement('img');
            imgChiquita.setAttribute('src', item.producto.imagen);
            imgChiquita.setAttribute('alt', item.producto.nombre);
            divImgChiquita.appendChild(imgChiquita);
            divProductoInfo.appendChild(divImgChiquita);

            li.appendChild(divProductoInfo);

            const divSubtotalEliminar = document.createElement('div');
            const spanSubtotal = document.createElement('span');
            spanSubtotal.textContent = `$${item.subtotal.toFixed(3)}`;
            divSubtotalEliminar.appendChild(spanSubtotal);

            const btnEliminar = document.createElement('button');
            btnEliminar.classList.add('eliminar', 'btn-pipo');
            btnEliminar.textContent = 'X';
            btnEliminar.setAttribute('data-id', item.producto.id);
            btnEliminar.addEventListener('click', (event) => {
                const id = parseInt(event.target.dataset.id);
                miCarrito.eliminarProducto(id);
                renderizarContenidoCarritoModal();
                actualizarVistaCarrito();
            });
            divSubtotalEliminar.appendChild(btnEliminar);

            li.appendChild(divSubtotalEliminar);
            listaCarritoUl.appendChild(li);
        });
    }
    modalContentDiv.appendChild(listaCarritoUl);

    const totalCarritoP = document.createElement('p');
    totalCarritoP.id = 'total-carrito';
    totalCarritoP.textContent = `Total: $${miCarrito.getTotalPagar().toFixed(3)}`;
    modalContentDiv.appendChild(totalCarritoP);

    const btnVaciarCarrito = document.createElement('button');
    btnVaciarCarrito.classList.add('btn', 'btn-pipo');
    btnVaciarCarrito.textContent = 'Vaciar Carrito';
    btnVaciarCarrito.addEventListener('click', () => {
        miCarrito.items = [];
        miCarrito.saveToLocalStorage();
        renderizarContenidoCarritoModal();
        actualizarVistaCarrito();
    });
    modalContentDiv.appendChild(btnVaciarCarrito);

    carritoModal.appendChild(modalContentDiv);
}
// muestro el detalle del producto en la modal
function mostrarDetalleProductoModal(producto) {
    while (detalleProductoModal.firstChild) {
        detalleProductoModal.removeChild(detalleProductoModal.firstChild);
    }

    const modalContentDiv = document.createElement('div');
    modalContentDiv.classList.add('modal-content');

    const closeButton = document.createElement('span');
    closeButton.classList.add('close-button');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', cerrarDetalleProductoModal);
    modalContentDiv.appendChild(closeButton);

    const detalleContenidoDiv = document.createElement('div');
    detalleContenidoDiv.classList.add('detalle-producto-contenido');

    const img = document.createElement('img');
    img.setAttribute('src', producto.imagen);
    img.setAttribute('alt', producto.nombre);
    detalleContenidoDiv.appendChild(img);

    const h2 = document.createElement('h2');
    h2.textContent = producto.nombre;
    detalleContenidoDiv.appendChild(h2);

    const pDescripcion = document.createElement('p');
    pDescripcion.textContent = producto.descripcion;
    detalleContenidoDiv.appendChild(pDescripcion);

    const pPrecio = document.createElement('p');
    const bPrecio = document.createElement('b');
    bPrecio.textContent = `Precio: $${producto.precio.toFixed(3)}`;
    pPrecio.appendChild(bPrecio);
    detalleContenidoDiv.appendChild(pPrecio);

    const agregarCarritoBtn = document.createElement('button');
    agregarCarritoBtn.classList.add('btn', 'btn-pipo');
    agregarCarritoBtn.textContent = 'Agregar al Carrito';
    agregarCarritoBtn.setAttribute('data-id', producto.id);
    agregarCarritoBtn.addEventListener('click', (event) => {
        const productId = parseInt(event.target.dataset.id);
        const productoToAdd = productosDisponibles.find(p => p.id === productId);
        if (productoToAdd) {
            miCarrito.agregarProducto(productoToAdd);
            actualizarVistaCarrito();
            cerrarDetalleProductoModal();
        }
    });
    detalleContenidoDiv.appendChild(agregarCarritoBtn);

    modalContentDiv.appendChild(detalleContenidoDiv);
    detalleProductoModal.appendChild(modalContentDiv);
    detalleProductoModal.classList.add('visible');
}
// funcioncita para cerra la modal
function cerrarDetalleProductoModal() {
    detalleProductoModal.classList.remove('visible');
}



//Aplica los filtros de categoría y ordenamiento de precio a los productos.
//Renderiza los productos actualizados en la vista.
 
function aplicarFiltrosYOrdenamiento() {
    // Trabaja con una copia de los productos originales
    let productosFiltrados = productosDisponibles; 

    // Filtrar por categoría
    const categoriaSeleccionada = selectCategoria.value;
    if (categoriaSeleccionada && categoriaSeleccionada !== 'todas') {
        productosFiltrados = productosFiltrados.filter(producto => producto.categoria === categoriaSeleccionada);
    }

    // Ordenar por precio
    const ordenSeleccionado = selectOrdenPrecio.value;
    if (ordenSeleccionado === 'ascendente') {
        productosFiltrados.sort((a, b) => a.precio - b.precio);
    } else if (ordenSeleccionado === 'descendente') {
        productosFiltrados.sort((a, b) => b.precio - a.precio);
    }
    // Guarda el resultado para renderizar
    productosFiltradosOrdenados = productosFiltrados; 
    renderizarProductos(productosFiltradosOrdenados);
}

//Llena el select de categorías con las categorías únicas de los productos disponibles.

function cargarFiltroCategorias() {
    const categorias = new Set();
    productosDisponibles.forEach(producto => {
        categorias.add(producto.categoria);
    });

    // Limpiar opciones existentes, excepto la primera "Todas" si ya existe
    // Mantiene la opción 'Todas' si es la primera
    while (selectCategoria.children.length > 1) {
        selectCategoria.removeChild(selectCategoria.lastChild);
    }
    
    // Crear y añadir opciones para cada categoría única
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.setAttribute('value', categoria);
        option.textContent = categoria;
        selectCategoria.appendChild(option);
    });
};


// función para cargar productos desde JSON ---
function cargarProductosDesdeJSON() {
    fetch('productos.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            productosDisponibles = data.map(p => new Producto(p.id, p.nombre, p.precio, p.imagen, p.descripcion, p.categoria));
            console.log('Productos cargados desde JSON:', productosDisponibles);

            // Inicialmente, mostrar todos los productos
            productosFiltradosOrdenados = productosDisponibles;
            renderizarProductos(productosFiltradosOrdenados);
            actualizarVistaCarrito();

            // cargar el filtro de categorías
            cargarFiltroCategorias();

            // Event Listeners para los filtros y ordenar
            if (selectCategoria) {
                selectCategoria.addEventListener('change', aplicarFiltrosYOrdenamiento);
            }
            if (selectOrdenPrecio) {
                selectOrdenPrecio.addEventListener('change', aplicarFiltrosYOrdenamiento);
            }

            // Event Listener para abrir la modal del carrito
            if (verCarritoBtn) {
                verCarritoBtn.addEventListener('click', toggleCarritoModal);
            }

            //  Listener para cerrar la modal del carrito haciendo clic fuera 
            carritoModal.addEventListener('click', (e) => {
                if (e.target === carritoModal) {
                    toggleCarritoModal();
                }
            });

            // Event Listener para cerrar la modal de detalle haciendo clic fuera de ella
            detalleProductoModal.addEventListener('click', (e) => {
                if (e.target === detalleProductoModal) {
                    cerrarDetalleProductoModal();
                }
            });

        })
        .catch(error => {
            console.error('Error al cargar los productos desde JSON:', error);
            
        });
}

// inicio la cargaa
cargarProductosDesdeJSON();
