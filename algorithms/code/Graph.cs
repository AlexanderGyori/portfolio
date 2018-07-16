using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Graph : MonoBehaviour {

    private int nodeIdCount;
    private int edgeIdCount;
    public List<Node> nodes { get; set; }
    public List<Edge> edges { get; set; }
    private Node sourceNode;
    public Node SourceNode { 
        get { return sourceNode; } 
        set {
            if (sourceNode) { sourceNode.spriteRenderer.sprite = nodeSprite; }
            if (value == targetNode) { targetNode = null; }
            sourceNode = value;
            if (sourceNode) { sourceNode.spriteRenderer.sprite = startNodeSprite; }
        }
    }
    private Node targetNode;
    public Node TargetNode { 
        get { return targetNode; } 
        set {
            if (targetNode) { targetNode.spriteRenderer.sprite = nodeSprite; }
            if (value == sourceNode) { sourceNode = null; }
            targetNode = value;
            if (targetNode) { targetNode.spriteRenderer.sprite = endNodeSprite; }
        }
    }
    public Node prefabNode;
    public Edge prefabEdge;
    public EdgeTag prefabEdgeTag;
    public Sprite nodeSprite;
    public Sprite startNodeSprite;
    public Sprite endNodeSprite;
    public Transform canvas;
    public bool Locked {get; set;}

    public void AddNode(Color colour) {
        Vector3 target = Camera.main.ScreenToWorldPoint(Input.mousePosition);
        target.z = 0;
        Node newNode = Instantiate(prefabNode, target, Quaternion.identity, transform);
        newNode.Initialize(this, nodeIdCount, colour);
        nodes.Add(newNode);
        nodeIdCount++;
    }

    public void RemoveNode(Node node) {
        if (sourceNode && node.Id == sourceNode.Id) {
            sourceNode = null;
        }
        if (targetNode && node.Id == targetNode.Id) {
            targetNode = null;
        }
        nodes.Remove(node);
        edges.RemoveAll(delegate(Edge edge) {
            if (edge.Begin.Id == node.Id || edge.End.Id == node.Id) {
                edge.Destroy();
                return true;
            } else {
                return false;
            }
        });
        Destroy(node.gameObject);
    }

    public void AddEdge(int beginId, int endId) {
        Edge newEdge = Instantiate(prefabEdge, Vector3.zero, Quaternion.identity, transform);
        Node begin = nodes.Find(node => node.Id == beginId);
        Node end = nodes.Find(node => node.Id == endId);
        EdgeTag tag = Instantiate(prefabEdgeTag, Vector3.zero, Quaternion.identity, canvas);
        tag.Initialize(newEdge);
        newEdge.Initialize(this, edgeIdCount, begin, end, tag);
        newEdge.BeginPosition = new Vector3(begin.transform.position.x, begin.transform.position.y, 1);
        newEdge.EndPosition = new Vector3(end.transform.position.x, end.transform.position.y, 1);
        edges.Add(newEdge);
        edgeIdCount++;
    }

    public void RemoveEdge(Edge edge) {
        edges.Remove(edge);
        edge.Destroy();
    }

    public bool DoesEdgeExist(int beginId, int endId) {
        return edges.Find(edge => (edge.Begin.Id == beginId && edge.End.Id == endId) || (edge.Begin.Id == endId && edge.End.Id == beginId)) != null;
    }

    public Node GetNode(int id) {
        return nodes.Find(delegate(Node n) {
            return n.Id == id;
        });
    }

    public Edge GetEdge(int id) {
        return edges.Find(delegate(Edge e) {
            return e.Id == id;
        });
    }

    public void UpdateEdgePositions(Node node) {
        List<Edge> edgeList = edges.FindAll(edge => edge.Begin.Id == node.Id || edge.End.Id == node.Id);
        edgeList.ForEach(delegate(Edge edge) {
            if (edge.Begin.Id == node.Id) {
                edge.BeginPosition = new Vector3(node.transform.position.x, node.transform.position.y, 1);
            } else {
                edge.EndPosition = new Vector3(node.transform.position.x, node.transform.position.y, 1);
            }
        });
    }

    public void ChangeEdgeColour(int id, Color c) {
        Edge edge = GetEdge(id);
        edge.Colour = c;
    }

    public void ChangeNodeColour(int id, Color c) {
        Node node = GetNode(id);
        node.Colour = c;
    }

    public void ResetAllColours() {
        nodes.ForEach(delegate(Node n) {
            n.Colour = Color.white;
        });
        edges.ForEach(delegate(Edge e) {
            e.Colour = Color.black;
        });
    }

    public void Lock() {
        Locked = true;
        edges.ForEach(delegate(Edge e) {
            e.eTag.capInputField.enabled = false;
            e.eTag.costInputField.enabled = false;
        });
    }

    public void Unlock() {
        Locked = false;
        edges.ForEach(delegate(Edge e) {
            e.eTag.capInputField.enabled = true;
            e.eTag.costInputField.enabled = true;
        });
    }

    public void ApplyState(GraphState state) {
        if (state == null) {
            return;
        }
        nodes.ForEach(delegate(Node n) {
            NodeState thisState = state.Nodes.Find(delegate(NodeState s) {
                return n.Id == s.Id;
            });
            n.Colour = thisState.Colour;
        });
        edges.ForEach(delegate(Edge e) {
            EdgeState thisState = state.Edges.Find(delegate(EdgeState s) {
                return e.Id == s.Id;
            });
            e.Colour = thisState.Colour;
            e.Flow = thisState.Flow;
        });
    }

    public void ClearFlows() {
        edges.ForEach(delegate(Edge edge) {
            edge.Flow = 0;
        });
    }

    public GraphState CreateGraphState(string code) {
        GraphState gState = new GraphState();
        gState.Code = code;
        List<NodeState> nStates = new List<NodeState>();
        List<EdgeState> eStates = new List<EdgeState>();
        nodes.ForEach(delegate(Node n) {
            nStates.Add(new NodeState(n.Id, n.Colour));
        });
        edges.ForEach(delegate(Edge e) {
            eStates.Add(new EdgeState(e.Id, e.Flow, e.Colour));
        });
        gState.Nodes = nStates;
        gState.Edges = eStates;
        return gState;
    }

    void Start() {
        nodeIdCount = 0;
        edgeIdCount = 0;
        nodes = new List<Node>();
        edges = new List<Edge>();
    }
}
