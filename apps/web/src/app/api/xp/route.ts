import { suggestXp, type EffortBand, type ResistanceBand, type ValueBand, type XpInput } from "@grove/core";

type XpRequestBody = XpInput & {
  planning?: boolean;
  isHyperfixationGoal?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as XpRequestBody;
  const input: XpInput = {
    effort: body.effort as EffortBand,
    resistance: body.resistance as ResistanceBand,
    value: body.value as ValueBand,
    urgent: body.urgent,
    communityContribution: body.communityContribution,
    planning: Boolean(body.planning),
    isHyperfixationGoal: Boolean(body.isHyperfixationGoal),
  };
  return Response.json(suggestXp(input));
}

