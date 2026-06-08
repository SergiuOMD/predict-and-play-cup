import { Target, Trophy, Users, Clock, Star, Shield, Info } from "lucide-react";

type RuleSection = {
  icon: typeof Target;
  title: string;
  items: string[];
};

const SECTIONS: RuleSection[] = [
  {
    icon: Users,
    title: "1. Participare",
    items: [
      "Totalizatorul este destinat angajaților ORBICO MOLDOVA — joc recreativ, fără mize financiare.",
      "Contul se creează cu email și parolă. La înregistrare este obligatoriu un cod de invitație valid.",
      "Fiecare participant poate avea un singur cont. Numele afișat apare în clasament.",
    ],
  },
  {
    icon: Target,
    title: "2. Pronosticuri meci",
    items: [
      "Pentru fiecare meci trimiți exact 3 scoruri (pot fi identice sau diferite).",
      "Primești 1 punct pentru fiecare scor ghicit exact — maximum 3 puncte per meci.",
      "Nu există puncte parțiale pentru diferență de goluri sau pentru câștigătorul meciului.",
      "Pronosticurile pot fi modificate oricând până la blocare.",
    ],
  },
  {
    icon: Clock,
    title: "3. Termene limită",
    items: [
      "Pronosticurile pentru un meci se blochează automat cu 1 oră înainte de ora de start (kickoff).",
      "După blocare, scorurile trimise nu mai pot fi schimbate.",
      "Predicțiile bonus (campion și golgheter) se blochează la data stabilită de organizatori, înainte de startul turneului.",
    ],
  },
  {
    icon: Star,
    title: "4. Predicții bonus",
    items: [
      "Fiecare jucător alege echipa campioană mondială și golgheterul turneului.",
      "Punctele bonus se acordă la finalul turneului, când rezultatele oficiale sunt confirmate.",
      "Valoarea punctelor bonus (implicit 5 puncte fiecare) poate fi configurată de organizatori.",
    ],
  },
  {
    icon: Trophy,
    title: "5. Clasament",
    items: [
      "Scorul total = puncte din meciuri + puncte bonus campion + puncte bonus golgheter.",
      "Clasamentul se actualizează automat după ce scorurile meciurilor sunt introduse.",
      "La egalitate de puncte, mai sus este jucătorul cu mai multe pronosticuri trimise.",
    ],
  },
  {
    icon: Shield,
    title: "6. Corectitudine & administrare",
    items: [
      "Scorurile oficiale ale meciurilor sunt sursa pentru calculul punctelor.",
      "Organizatorii pot corecta scoruri sau dezactiva conturi care încalcă regulamentul.",
      "Deciziile organizatorilor în caz de dispute sunt finale.",
    ],
  },
  {
    icon: Info,
    title: "7. Notă importantă",
    items: [
      "Acest totalizator este doar pentru distracție între colegi — nu implică pariuri cu bani.",
      "Regulamentul poate fi actualizat; versiunea publicată pe site este cea aplicabilă.",
    ],
  },
];

export function RegulamentContent() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Regulamentul oficial al totalizatorului ORBICO MOLDOVA World Cup 2026. Citește regulile
        înainte de a trimite pronosticuri.
      </p>

      <div className="grid gap-4">
        {SECTIONS.map(({ icon: Icon, title, items }) => (
          <section key={title} className="app-card p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--wc-hermes)]/10">
                <Icon className="h-5 w-5 text-[var(--wc-hermes)]" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
            </div>
            <ul className="space-y-2 pl-1">
              {items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--wc-hermes)]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
