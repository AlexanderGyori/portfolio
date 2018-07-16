using System.Collections;
using System.Collections.Generic;

public class AlgorithmController {

    public int step { get; private set; }
    public int totalSteps { get; private set; }
    private Algorithm algo;

    public AlgorithmController(Algorithm algorithm) {
        algo = algorithm;
        step = 0;
    }

    public GraphState Play() {
        algo.States = new List<GraphState>();
        algo.Execute();
        step = 0;
        totalSteps = algo.States.Count;
        return algo.States[0];
    }

    public GraphState Next() {
        if (step != algo.States.Count - 1) {
            return algo.States[++step];
        } else {
            return null;
        }
    }

    public GraphState Previous() {
        if (step != 0) {
            return algo.States[--step];
        } else {
            return null;
        }
    }
}
