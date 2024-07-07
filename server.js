const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Configuração do PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gerenciadorpedido',
  password: '558361',
  port: 5432,
});

// Middleware
app.use(bodyParser.json());

// verifica se a data é válida
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date);
};

app.get('/', (req, res) => {
    res.send('SERVIDOR ONLINE ;D ');
  });

  app.get('/order', (req, res) => {
    res.send('CRIAR PEDIDO: \n UTILIZE O COMANDO CURL SE ESTIVER NO WINDOWS \n');
  });

  

// Rotas

// Criar um novo pedido
app.post('/order', async (req, res) => {
  const { numeroPedido, valorTotal, dataCriacao, items } = req.body;

  console.log('Recebido para criação:', req.body);

  // Verificar se dataCriacao é válida
  if (!isValidDate(dataCriacao)) {
    return res.status(400).send('Data de criação inválida');
  }

  // Transformar os dados
  const orderId = numeroPedido;
  const value = valorTotal;
  const creationDate = new Date(dataCriacao).toISOString();
  const transformedItems = items.map(item => ({
    productId: item.idItem,
    quantity: item.quantidadeItem,
    price: item.valorItem
  }));

  console.log('Dados transformados para inserção:', { orderId, value, creationDate, transformedItems });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertOrderText = 'INSERT INTO "Order" (orderId, value, creationDate) VALUES ($1, $2, $3)';
    const insertOrderValues = [orderId, value, creationDate];
    await client.query(insertOrderText, insertOrderValues);

    const insertItemText = 'INSERT INTO items (orderId, productId, quantity, price) VALUES ($1, $2, $3, $4)';
    for (const item of transformedItems) {
      const insertItemValues = [orderId, item.productId, item.quantity, item.price];
      await client.query(insertItemText, insertItemValues);
    }

    await client.query('COMMIT');
    res.status(201).send('Pedido criado com sucesso');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', e);
    res.status(500).send('Erro ao criar pedido');
  } finally {
    client.release();
  }
});

// Obter os dados do pedido
app.get('/order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const client = await pool.connect();
  try {
    const orderResult = await client.query('SELECT * FROM "Order" WHERE orderId = $1', [orderId]);
    const itemsResult = await client.query('SELECT * FROM items WHERE orderId = $1', [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).send('Pedido não encontrado');
    }

    const order = orderResult.rows[0];
    const items = itemsResult.rows;

    res.json({
      orderId: order.orderid,
      value: order.value,
      creationDate: order.creationdate,
      items: items.map(item => ({
        productId: item.productid,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  } catch (e) {
    console.error('Erro ao obter pedido:', e);
    res.status(500).send('Erro ao obter pedido');
  } finally {
    client.release();
  }
});

// Listar todos os pedidos
app.get('/order/list', async (req, res) => {
  const client = await pool.connect();
  try {
    const ordersResult = await client.query('SELECT * FROM "Order"');
    const itemsResult = await client.query('SELECT * FROM items');

    const orders = ordersResult.rows;
    const items = itemsResult.rows;

    const ordersWithItems = orders.map(order => ({
      orderId: order.orderid,
      value: order.value,
      creationDate: order.creationdate,
      items: items
        .filter(item => item.orderid === order.orderid)
        .map(item => ({
          productId: item.productid,
          quantity: item.quantity,
          price: item.price,
        })),
    }));

    res.json(ordersWithItems);
  } catch (e) {
    console.error('Erro ao listar pedidos:', e);
    res.status(500).send('Erro ao listar pedidos');
  } finally {
    client.release();
  }
});

// Atualizar pedido
app.put('/order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { valorTotal, dataCriacao, items } = req.body;

  console.log('Recebido para atualização:', req.body);

  // Verificar se dataCriacao é válida
  if (!isValidDate(dataCriacao)) {
    return res.status(400).send('Data de criação inválida');
  }

  // Transformar os dados
  const value = valorTotal;
  const creationDate = new Date(dataCriacao).toISOString();
  const transformedItems = items.map(item => ({
    productId: item.idItem,
    quantity: item.quantidadeItem,
    price: item.valorItem
  }));

  console.log('Dados transformados para atualização:', { value, creationDate, transformedItems });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateOrderText = 'UPDATE "Order" SET value = $1, creationDate = $2 WHERE orderId = $3';
    const updateOrderValues = [value, creationDate, orderId];
    await client.query(updateOrderText, updateOrderValues);

    const deleteItemsText = 'DELETE FROM items WHERE orderId = $1';
    await client.query(deleteItemsText, [orderId]);

    const insertItemText = 'INSERT INTO items (orderId, productId, quantity, price) VALUES ($1, $2, $3, $4)';
    for (const item of transformedItems) {
      const insertItemValues = [orderId, item.productId, item.quantity, item.price];
      await client.query(insertItemText, insertItemValues);
    }

    await client.query('COMMIT');
    res.status(200).send('Pedido atualizado com sucesso');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar pedido:', e);
    res.status(500).send('Erro ao atualizar pedido');
  } finally {
    client.release();
  }
});

// Deletar pedido
app.delete('/order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deleteItemsText = 'DELETE FROM items WHERE orderId = $1';
    await client.query(deleteItemsText, [orderId]);

    const deleteOrderText = 'DELETE FROM "Order" WHERE orderId = $1';
    await client.query(deleteOrderText, [orderId]);

    await client.query('COMMIT');
    res.status(200).send('Pedido deletado com sucesso');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Erro ao deletar pedido:', e);
    res.status(500).send('Erro ao deletar pedido');
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
