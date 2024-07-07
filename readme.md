# API gerenciamento de Pedidos

Requisitos

-Node.Js
-PostgreSQL


# Criar um novo pedido

EX:
utilize o Curl --location para criação

# consultar pelo numero do pedido
EX:
http://localhost:3000/order/v10089016vdb

# Atualizar o pedido passando por parâmetro na url o número do pedido que será atualizado
EX:
curl --location "http://localhost:3000/order" --header "Content-Type: application/json" --data "{\"numeroPedido\": \"v10089015vdb-02\", \"valorTotal\": 20000, \"dataCriacao\": \"2023-07-19T12:24:11.5299601+00:00\", \"items\": [{\"idItem\": \"2434\", \"quantidadeItem\": 2, \"valorItem\": 2000}]}"

# Delete pedido
Ex:
curl --request DELETE "http://localhost:3000/order/v10089015vdb-01"  