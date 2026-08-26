# Autenticação e perfil

## O que está mockado

### Sessão

Fonte atual: `components/auth/authentication-provider.tsx`.

- sessão salva em `seconecta:auth-session`;
- identidades conhecidas em `seconecta:known-identities`;
- Google usa `conta-google@mock.seconecta`;
- confirmação de WhatsApp e OAuth são simulados com `setTimeout`;
- contas conectadas existem apenas no navegador;
- restauração de usuário antigo é inferida pelo `localStorage`.

### Perfil

Fontes atuais:

- `services/onboarding-service.ts`;
- `components/journey/profile-unlocks.tsx`;
- `components/preferences/preferences-modal.tsx`.

Onboarding, nome preferido, idiomas, disponibilidade, escola, localização, notificações e planos futuros são locais.

## Contrato que deve permanecer

Autenticação e preenchimento do perfil continuam sendo fluxos diferentes.

- visitantes podem explorar, buscar, ler oportunidades e receber recomendações;
- autenticação aparece somente quando persistência ou identidade forem necessárias;
- WhatsApp permanece a opção principal e Google a secundária;
- não introduzir e-mail/senha sem uma nova decisão de produto;
- a cópia deve falar em salvar/continuar a Jornada, nunca em “criar conta”;
- depois da autenticação, retornar exatamente à ação interrompida;
- usuário existente não refaz onboarding;
- uma conta pode vincular WhatsApp e Google;
- o perfil continua progressivo e opcional, explicando o benefício de cada dado.
- todas as etapas do onboarding oferecem “Já tenho conta” sem apagar o progresso anônimo;
- logout encerra somente a sessão; dados locais continuam disponíveis para merge ou recuperação após nova autenticação.

## Modelo sugerido

```ts
type UserIdentity = {
  provider: "whatsapp" | "google";
  providerSubject: string;
  connectedAt: string;
};

type StudentProfile = {
  userId: string;
  preferredName?: string;
  educationLevel?: string;
  gradeOrGraduation?: string;
  languages: { language: string; proficiency: string }[];
  notificationPreferences: Record<string, boolean>;
  updatedAt: string;
};
```

## Integração

1. Trocar `readSession()` por endpoint de sessão/cookie segura.
2. WhatsApp deve iniciar challenge e aguardar confirmação real.
3. Google deve usar OAuth e retornar à rota/ação original.
4. Depois do sucesso, enviar os dados anônimos com um `anonymousSessionId`.
5. O backend deve executar merge idempotente de onboarding, oportunidades, feedback e páginas vistas.
6. Manter `openAuthentication(reason, continuation, provider)` como interface da UI; mudar apenas a implementação.
7. `PreferencesProvider` continua sendo o ponto global de abertura, mas passa a ler e salvar via serviço de perfil.
8. Trocar `logout()` local por revogação de sessão no servidor e limpeza do cookie; depois redirecionar para a home pública.

## Estados obrigatórios

- carregando sessão;
- anônimo;
- aguardando WhatsApp;
- OAuth em andamento;
- sucesso novo;
- sucesso “bem-vindo de volta”;
- identidade já conectada;
- conflito entre identidades;
- falha/retry sem perder a ação original.
