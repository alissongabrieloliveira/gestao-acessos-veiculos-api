/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return (
    knex.schema
      // 1. Tabela de Usuários (Login do Sistema)
      .createTable("usuarios", (table) => {
        table.increments("id").primary();
        table.string("nome").notNullable();
        table.string("email").unique().notNullable();
        table.string("senha_hash").notNullable();
        table.string("tipo_de_usuario").defaultTo("operador"); // admin, operador
        table.boolean("ativo").defaultTo(true);
        table.timestamps(true, true); // created_at, updated_at
      })

      // 2. Tabelas Auxiliares (Sem dependências)
      .createTable("setores", (table) => {
        table.increments("id").primary();
        table.string("nome").notNullable();
        table.timestamps(true, true);
      })
      .createTable("postos_controle", (table) => {
        table.increments("id").primary();
        table.string("nome").notNullable();
        table.timestamps(true, true);
      })
      .createTable("tipos_de_pessoas", (table) => {
        table.increments("id").primary();
        table.string("nome").notNullable(); // colaborador, terceiro, visitante
        table.timestamps(true, true);
      })
      .createTable("cidades", (table) => {
        table.increments("id").primary();
        table.string("nome").notNullable();
        table.string("uf", 2); // Adicionei UF para consistência
        table.timestamps(true, true);
      })

      // 3. Tabela de Pessoas (Depende de tipos_de_pessoas)
      .createTable("pessoas", (table) => {
        table.increments("id").primary();
        table.string("nome").notNullable();
        table.string("documento").unique(); // CPF/RG
        table.string("telefone");
        // Relacionamento com tipos_de_pessoas
        table
          .integer("tipo_pessoa_id")
          .references("id")
          .inTable("tipos_de_pessoas")
          .onDelete("SET NULL");
        table.timestamps(true, true);
      })

      // 4. Tabela de Veículos
      .createTable("veiculos", (table) => {
        table.increments("id").primary();
        table.string("placa").unique().notNullable();
        table.string("modelo");
        table.string("cor");
        table.boolean("veiculo_de_frota_propria").defaultTo(false);
        table.timestamps(true, true);
      })

      // 5. Movimentações de Acessos (Visitantes/Terceiros/Colaboradores comuns)
      .createTable("movimentacoes_acessos", (table) => {
        table.increments("id").primary();

        // Chaves Estrangeiras
        table
          .integer("id_pessoa")
          .references("id")
          .inTable("pessoas")
          .notNullable();
        table
          .integer("id_veiculo")
          .references("id")
          .inTable("veiculos")
          .nullable(); // Pode entrar a pé
        table.integer("id_setor_visitado").references("id").inTable("setores");

        // Entrada
        table
          .integer("id_usuario_entrada")
          .references("id")
          .inTable("usuarios");
        table
          .integer("id_posto_controle_entrada")
          .references("id")
          .inTable("postos_controle");
        table.float("km_entrada").nullable();
        table.timestamp("data_hora_entrada").defaultTo(knex.fn.now());
        table.string("motivo_da_visita");

        // Saída
        table.integer("id_usuario_saida").references("id").inTable("usuarios");
        table
          .integer("id_posto_controle_saida")
          .references("id")
          .inTable("postos_controle");
        table.float("km_saida").nullable();
        table.timestamp("data_hora_saida").nullable();

        table.text("observacao");
        table.string("status").defaultTo("patio"); // patio, saiu
      })

      // 6. Movimentações de Frota (Carros da empresa viajando)
      .createTable("movimentacoes_frota", (table) => {
        table.increments("id").primary();

        table
          .integer("id_pessoa")
          .references("id")
          .inTable("pessoas")
          .notNullable(); // Motorista
        table
          .integer("id_veiculo")
          .references("id")
          .inTable("veiculos")
          .notNullable(); // Obrigatório ser carro

        // Saída (Início da viagem) - Note que na frota a lógica inverte (sai para viajar)
        // Mas seguindo seu esquema: Entrada no registro = Saída da garagem?
        // VOU SEGUIR SEU ESQUEMA: Entrada = Registro inicial (Saída da empresa)

        table
          .integer("id_usuario_entrada")
          .references("id")
          .inTable("usuarios");
        table
          .integer("id_posto_controle_entrada")
          .references("id")
          .inTable("postos_controle");
        table.float("km_entrada").notNullable(); // Obrigatório na frota (Saída da garagem)
        table.timestamp("data_hora_entrada").defaultTo(knex.fn.now());

        // Retorno (Volta para a empresa)
        table.integer("id_usuario_saida").references("id").inTable("usuarios");
        table
          .integer("id_posto_controle_saida")
          .references("id")
          .inTable("postos_controle");
        table.float("km_saida").nullable(); // Será obrigatório no update
        table.timestamp("data_hora_saida").nullable();

        table
          .integer("id_cidade_de_destino")
          .references("id")
          .inTable("cidades");
        table.text("observacao");
        table.string("motivo_saida");
        table.string("status").defaultTo("em_viagem"); // patio (se voltou), em_viagem (se saiu)
      })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("movimentacoes_frota")
    .dropTableIfExists("movimentacoes_acessos")
    .dropTableIfExists("veiculos")
    .dropTableIfExists("pessoas")
    .dropTableIfExists("cidades")
    .dropTableIfExists("tipos_de_pessoas")
    .dropTableIfExists("postos_controle")
    .dropTableIfExists("setores")
    .dropTableIfExists("usuarios");
};
