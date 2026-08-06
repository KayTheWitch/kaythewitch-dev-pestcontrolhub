# Edição, exclusão e gestão de usuários

Objetivo: permitir editar e excluir qualquer registro cadastrado (leads, clientes, produtos, serviços, equipes, EPIs, fornecedores, categorias, RT, etc.) e criar uma área de administração de usuários com redefinição de senha.

## 1. Editar e excluir cadastros

Padrão único aplicado em todas as listas:

- Coluna de ações no fim de cada linha, com "Editar" e "Excluir".
- "Editar" reabre o mesmo formulário de cadastro já preenchido (nenhum formulário novo é criado; os formulários existentes passam a aceitar valores iniciais).
- "Excluir" abre confirmação. Se o registro tiver histórico vinculado, a exclusão é bloqueada com mensagem clara e a opção de **inativar/arquivar** no lugar — nada é apagado em cascata.

Telas contempladas:

| Tela | Editar | Excluir |
|---|---|---|
| Leads | sim | sim (sem diagnóstico/proposta) |
| Clientes | sim | sim (sem OS, propostas ou títulos) |
| Diagnósticos | sim | sim (sem proposta) |
| Propostas | sim (rascunho/enviada) | sim (sem OS) |
| Ordens de serviço | sim (antes de concluída) | cancelar (concluída nunca é apagada) |
| Produtos, Serviços, Equipes, EPIs, Categorias financeiras | sim | sim (sem movimento/uso) |
| Fornecedores | sim | sim (sem pedidos) |
| Responsáveis técnicos | sim | sim (sem certificado emitido) |
| Lotes de estoque, títulos financeiros, movimentos | correção de dados cadastrais | não apagáveis (ajuste/cancelamento, para manter rastreabilidade fiscal e sanitária) |

Regras de proteção ficam no banco (checagem de vínculos antes de apagar), então valem também para qualquer outro caminho de acesso.

## 2. Senha esquecida

- Link "Esqueci minha senha" na tela de login: envia e-mail de redefinição.
- Nova página pública `/reset-password` para o usuário definir a nova senha.
- Configuração dos e-mails de autenticação do projeto para que a mensagem saia com a identidade do sistema.

## 3. Administração de usuários (`/cadastros/usuarios`, só admin)

- Lista de usuários com nome, e-mail, papéis e data de criação.
- Convidar novo usuário por e-mail já com papéis definidos.
- Atribuir/remover papéis: admin, comercial, técnico, cliente.
- Enviar e-mail de redefinição de senha para qualquer usuário.
- Desativar/reativar acesso (usuário sem papel não entra em nenhuma área) e excluir usuário quando não houver registros criados por ele.
- Nenhum admin pode remover o próprio papel de admin nem excluir a própria conta (evita ficar sem administrador).

## Detalhes técnicos

- Migração: políticas de UPDATE/DELETE já cobertas por `has_any_role`; adicionar funções `SECURITY DEFINER` de exclusão segura (ex.: `delete_client`, `delete_lead`) que validam vínculos e lançam erro legível; adicionar `active`/`ativo` onde faltar para o fluxo de inativação; política de `user_roles` para leitura e escrita por admin via `has_role`.
- Gestão de usuários usa `createServerFn` com `requireSupabaseAuth`, valida `has_role(admin)` e só então carrega o cliente administrativo para listar usuários, convidar, disparar recuperação de senha e desativar contas.
- Novo componente compartilhado `RowActions` (editar/excluir com confirmação) e `ConfirmDeleteDialog` para reduzir repetição nas ~15 listas.
- Formulários existentes recebem prop `initial` e passam a operar em modo criar/editar.
- `/reset-password` como rota pública tratando o hash `type=recovery` e chamando atualização de senha.
- README atualizado com a seção de gestão de usuários e as regras de exclusão.
