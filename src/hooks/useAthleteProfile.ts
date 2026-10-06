import { useQuery } from "@tanstack/react-query";
import {
  fetchAffiliationPublic,
  fetchAthletePublic,
  fetchTeamPublic,
} from "@/api/admin";
import { resolveMediaUrl } from "@/utils/media";

export type ParticipantType = "athlete" | "team";

export interface ParticipantProfile {
  photoUrl: string | null;
  box: string | null;
}

export function useAthleteProfile(
  participantId: number | null,
  participantType: ParticipantType = "athlete",
) {
  return useQuery<ParticipantProfile>({
    queryKey: ["participant-profile", participantType, participantId],
    queryFn: async () => {
      const id = participantId as number;
      let photo: string | null | undefined;
      let affiliationId: number | null | undefined;

      if (participantType === "team") {
        const team = await fetchTeamPublic(id);
        photo = team.profile_photo;
        affiliationId = team.affiliation ?? null;
      } else {
        const athlete = await fetchAthletePublic(id);
        photo = athlete.profile_photo;
        affiliationId = athlete.affiliation ?? null;
      }

      const box = affiliationId
        ? (await fetchAffiliationPublic(affiliationId)).name
        : null;

      return { photoUrl: resolveMediaUrl(photo), box };
    },
    enabled: participantId != null,
    staleTime: 5 * 60_000,
    retry: false,
  });
}