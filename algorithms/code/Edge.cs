using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Edge : MonoBehaviour {

    private const float EDGE_TAG_SPACER = 0.25f;
    private const float TAG_Z_VALUE = -1.0f;
    private const float LINE_Z_VALUE = 1.0f;
    private const float LINE_POINTER_LENGTH = 0.25f;
    private const int LINE_POINTER_ANGLE = 45;

    private Graph graph;
    public LineRenderer line;
    public EdgePointer linePointer;
    public CapsuleCollider hitBox;
    public MarkList Marks { get; set; }
    public EdgeTag eTag { get; set; }
    public int Id { get; set; }
    public Node Begin { get; set; }
    public Node End { get; set; }
    private Vector3 beginPosition;
    public Vector3 BeginPosition { 
        get { return beginPosition; }
        set {
            beginPosition = value;
            UpdateLine();
            UpdateCollider();
            if (eTag) { UpdateTagPosition(); }
        }
    }
    private Vector3 endPosition;
    public Vector3 EndPosition { 
        get { return endPosition; }
        set {
            endPosition = value;
            UpdateLine();
            UpdateCollider();
            if (eTag) { UpdateTagPosition(); }
        }
    }
    private int flow;
    public int Flow { 
        get { return flow; }
        set {
            flow = value;
            eTag.SetFlowText(value);
        }
    }
    private int capacity;
    public int Capacity { 
        get { return capacity; } 
        set {
            capacity = value;
            eTag.SetCapText(value);
        }
    }
    public int ResidualCapacity {
        get { return Capacity - Flow; }
    }
    private int cost;
    public int Cost { 
        get { return cost; }
        set {
            cost = value;
            eTag.SetCostText(value);
        }
    }
    private Color colour;
    public Color Colour {
        get { return colour; }
        set {
            if (eTag.background) {eTag.background.color = value;}
            line.startColor = value;
            line.endColor = value;
            linePointer.pointer.startColor = value;
            linePointer.pointer.endColor = value;
            colour = value;
        }
    }

    public void Initialize(Graph g, int id, Node begin, Node end, EdgeTag t) {
        graph = g;
        Id = id;
        Begin = begin;
        End = end;
        eTag = t;
        Marks = new MarkList();
        Colour = Color.black;
        UpdateLine();
        UpdateCollider();
        UpdateTagPosition();
    }

    private void UpdateLine() {
        Vector3 tip = (End ? endPosition + (beginPosition - endPosition).normalized * Node.NODE_RADIUS : endPosition);
        tip.z = LINE_Z_VALUE;
        line.SetPositions(new Vector3[]{beginPosition, tip});
        linePointer.pointer.SetPositions(new Vector3[] {
            tip + Quaternion.Euler(0, 0, LINE_POINTER_ANGLE) * (beginPosition - endPosition).normalized * LINE_POINTER_LENGTH,
            tip,
            tip + Quaternion.Euler(0, 0, -LINE_POINTER_ANGLE) * (beginPosition - endPosition).normalized * LINE_POINTER_LENGTH
        });
    }

    private void UpdateCollider() {
        Vector3 vec = beginPosition + (endPosition - beginPosition) / 2.0f;
        vec.z = LINE_Z_VALUE;
        hitBox.transform.position = vec;
        hitBox.transform.LookAt(new Vector3(beginPosition.x, beginPosition.y, LINE_Z_VALUE));
        hitBox.height = (endPosition - beginPosition).magnitude;
    }

    private void UpdateTagPosition() {
        Vector3 midpoint = beginPosition + ((endPosition - beginPosition) / 2.0f);
        midpoint.z = TAG_Z_VALUE;
        eTag.transform.position = midpoint;
    }

    void OnMouseOver() {
        if (Input.GetMouseButtonUp(1) && !graph.Locked) {
            graph.RemoveEdge(this);
        }
    }

    public void Destroy(){
        Destroy(eTag.gameObject);
        Destroy(linePointer.gameObject);
        Destroy(gameObject);
    }
}
