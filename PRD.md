# PRD — Facilita Vistorias App
**Plataforma interna de vistorias imobiliárias assistida por IA**

Versão: 0.1 (MVP) · Autor: Osmar Gonçalves · Última atualização: 12/07/2026

---

## 1. Contexto e problema

A Facilita Vistorias (Blumenau/SC) presta vistorias técnicas independentes para
inquilinos e proprietários (contra vistoria, vistoria de entrada/saída, laudo de
compra segura). Hoje o processo de campo depende de ferramentas genéricas
(câmera + anotações manuais + montagem posterior do relatório), o que é lento,
sujeito a esquecimento de detalhes e difícil de padronizar entre vistoriadores.

Concorrentes de mercado (Devolus/Flash Vistoria, PropertyInspect, SnapInspect,
MyInspections, Happy Inspector) já resolvem parte do fluxo (captura por
ambiente, geração de termo, contestação online), mas nenhum usa IA para
**gerar a descrição do item a partir da foto + narração em áudio do
vistoriador**, que é o nosso diferencial.

## 2. Objetivo do MVP

Permitir que um vistoriador realize uma vistoria completa **pelo celular, em
campo, mesmo com internet instável**, tirando fotos por item/ambiente e
narrando em áudio o que está vendo — e que o sistema gere automaticamente uma
descrição técnica consolidada (foto + fala transcrita + complementos
inferidos pela IA), organizada por ambiente, pronta para virar um relatório
final compartilhável.

## 3. Restrição de negócio não-negociável

> ⚠️ A empresa **não possui registro no CREA**. Nenhuma tela, e-mail, PDF ou
> texto gerado pelo sistema pode usar os termos **"laudo"**, **"laudo
> técnico"** ou equivalentes regulados. Usar sempre: **"relatório
> fotográfico"**, **"relatório de vistoria"**, **"documentação técnica"**,
> **"análise de condições"**, **"consultoria predial"**. Todo relatório
> gerado deve trazer, em rodapé, o disclaimer de que se trata de documentação
> técnica independente, sem caráter de laudo pericial. Essa regra vale para
> nomes de tabelas voltadas a exibição, labels de UI, PDFs e qualquer
> comunicação (e-mail/WhatsApp) — ver `CLAUDE.md`.

## 4. Personas

| Persona | Quem é | Precisa de |
|---|---|---|
| **Vistoriador (campo)** | Osmar / futuros contratados | App rápido no celular, fluxo guiado por ambiente, funciona sem sinal, grava foto+áudio em poucos toques |
| **Gestor/Admin** | Vera Lúcia | Painel web: agenda, status das vistorias, aprovação/edição final antes de enviar, emissão do relatório |
| **Cliente (locatário/locador)** | Inquilino ou proprietário | Recebe link do relatório digital (WhatsApp/e-mail), visualiza fotos/descrições, pode contestar item específico |

## 5. Fluxo principal (MVP)

1. **Agendamento** — admin cria a vistoria (imóvel, tipo: entrada/saída/contra
   vistoria/compra segura, data, vistoriador responsável, dados de
   locador/locatário).
2. **Execução em campo (PWA offline-first)**
   - Vistoriador abre a vistoria do dia (dados já em cache local).
   - Para cada ambiente (ex.: "Quarto 1"), cria itens (piso, paredes, portas,
     mobiliário etc.).
   - Para cada item: tira 1+ fotos e grava um áudio curto narrando o que vê.
   - Tudo fica salvo localmente (IndexedDB) e entra numa fila de
     processamento — não depende de internet no momento da captura.
3. **Processamento por IA (quando há conexão)**
   - Foto + áudio do item são enviados juntos ao provedor de IA multimodal.
   - A IA gera uma descrição técnica do item combinando o que foi dito com o
     que é visível na foto (ex.: vistoriador não mencionou a cor da porta —
     a IA identifica "porta branca" pela imagem e inclui no texto).
   - Descrição sugerida fica editável — vistoriador ou admin sempre revisa e
     pode ajustar antes de finalizar.
4. **Revisão e fechamento**
   - Admin (ou o próprio vistoriador) revisa todos os itens/ambientes,
     ajusta textos, marca danos/avarias e responsáveis (se aplicável).
5. **Geração do relatório**
   - Sistema gera PDF do relatório de vistoria (layout com marca Facilita) e
     também uma versão digital acessível por link público com token único
     (como o `validar_vistoria.php` do Devolus), com QR code no PDF apontando
     para essa versão digital com fotos em alta resolução.
6. **Envio e contestação**
   - Link é enviado por WhatsApp/e-mail ao locatário/locador.
   - Cliente pode contestar itens específicos dentro do prazo configurado;
     contestação some notificação para os e-mails da equipe.

## 6. Escopo do MVP (must-have)

- [ ] Autenticação com papéis: admin, vistoriador, acesso público por token (cliente)
- [ ] CRUD de imóveis, locadores/locatários, agendamentos
- [ ] App de campo (PWA) com captura de foto + áudio por item, offline-first
- [ ] Pipeline de IA: transcrição + descrição consolidada por item
- [ ] Tela de revisão/edição do relatório antes de finalizar
- [ ] Geração de PDF + link público com token + QR code
- [ ] Envio manual do link por WhatsApp (deep link `wa.me`)
- [ ] Contestação de item pelo cliente (via link público)
- [ ] Painel admin com status das vistorias (agendada, em campo, em revisão, concluída, contestada)

## 7. Fora de escopo do MVP (fase 2+)

Baseado nas funcionalidades do Devolus (`Melhorias_e_funcionalidades_app.txt`) que fazem sentido depois:

- Comparação automática entre vistoria de entrada x saída (desgaste natural vs dano)
- Solicitação de orçamento de reparo a prestadores de serviço
- Assinatura digital integrada (tipo DocuSign/Fast4Sign)
- Múltiplos e-mails de notificação configuráveis por evento
- Geração de DOCX interativo, além do PDF
- Timeline da vistoria com geolocalização do vistoriador
- Portal do cliente com histórico de vistorias
- App para múltiplas imobiliárias parceiras (multi-tenant white-label)

## 8. Requisitos não funcionais

- **Offline-first obrigatório**: perda de conexão em campo não pode causar perda de dados.
- **Mobile-first**: uso real é 100% em celular durante a vistoria.
- **LGPD**: dados de CPF, fotos de imóveis de terceiros e assinaturas exigem
  política de retenção e controle de acesso claros.
- **Marca**: seguir identidade visual de facilitavistorias.com.br (tons claros,
  azul-céu, ícone de nuvem, tom "estamos do seu lado", ver `SYSTEM_DESIGN.md`).
- **Custo controlado**: uso de camadas gratuitas de IA como padrão, com
  fallback pago configurável (mesma filosofia do NexusLocal).

## 9. Métricas de sucesso do MVP

- Tempo médio de finalização de uma vistoria (captura → relatório pronto) < 30 min de trabalho manual de revisão.
- % de descrições geradas pela IA aceitas sem edição pelo vistoriador.
- Zero perda de fotos/áudios por falha de conexão em campo.
- Tempo de geração do PDF final < 60s para vistoria de imóvel médio (~8 ambientes).
