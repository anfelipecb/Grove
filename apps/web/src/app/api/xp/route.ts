import { suggestXp, type XpInput } from "@grove/core";

export async function POST(request: Request) {
  const input = (await request.json()) as XpInput;
  return Response.json(suggestXp(input));
}

