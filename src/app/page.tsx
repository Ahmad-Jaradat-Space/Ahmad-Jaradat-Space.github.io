import { FACES, DEFAULT_FACE_INDEX } from "@/lib/faceData";
import { RosettaStage } from "@/components/rosetta/RosettaStage";

export default function Home() {
  return <RosettaStage faces={FACES} defaultIndex={DEFAULT_FACE_INDEX} />;
}
