import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearnGoalPage } from "@/components/learn/learn-goal-page";
import { getLearnGoal, learnGoals } from "@/data/learn-content";

export function generateStaticParams() {
  return learnGoals.map((goal) => ({ goal: goal.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ goal: string }> }): Promise<Metadata> {
  const { goal: slug } = await params;
  const goal = getLearnGoal(slug);
  if (!goal) return {};
  return {
    title: `${goal.title} | Aprender | seConecta`,
    description: `${goal.description} Encontre guias, recursos e oportunidades recomendadas pela seConecta.`,
  };
}

export default async function Page({ params }: { params: Promise<{ goal: string }> }) {
  const { goal: slug } = await params;
  const goal = getLearnGoal(slug);
  if (!goal) notFound();
  return <LearnGoalPage goal={goal} />;
}

