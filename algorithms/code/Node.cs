using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Node : MonoBehaviour {

    private Graph graph;
    private Edge dragEdge;
    public MarkList Marks { get; set; }
    private bool moveToggle = false;
    private bool drawEdgeToggle = false;

    public const float NODE_RADIUS = 0.33f;

    public int Id { get; set; }
    private Color colour;
    public Color Colour { 
        get { return colour; }
        set { 
            spriteRenderer.color = value;
            colour = value;
        }
    }
    public Predecessor Pred { get; set; }
    public int Distance { get; set; }
    public SpriteRenderer spriteRenderer;

    public void Initialize(Graph g, int id, Color colour) {
        graph = g;
        Id = id;
        Colour = colour;
        Marks = new MarkList();
    }

    private int GetNodeIdFromMouse() {
        Ray ray;
        RaycastHit hit;
        Vector3 origin = Camera.main.ScreenToWorldPoint(Input.mousePosition);
        origin.z = -5.0f;
        ray = new Ray(origin, Vector3.forward);
        if (Physics.Raycast(ray, out hit, 5.0f)) {
            Node n = hit.collider.gameObject.GetComponent(typeof(Node)) as Node;
            return n.Id;
        } 
        return -1;
    }

    private void PreviewEdge() {
        int mouseNodeId = GetNodeIdFromMouse();
        if (Input.GetKeyUp("left shift") || Input.GetMouseButtonUp(0)) {
            if (mouseNodeId != Id && mouseNodeId != -1 && !graph.DoesEdgeExist(dragEdge.Begin.Id, mouseNodeId)) {
                // snap the line to the other node
                graph.AddEdge(dragEdge.Begin.Id, mouseNodeId);
            } 
            drawEdgeToggle = false;
            Destroy(dragEdge.gameObject);
        } else {
            // draw the line to the mouse pointer
            Vector3 target = Camera.main.ScreenToWorldPoint(Input.mousePosition);
            target.z = 1;
            dragEdge.EndPosition = target;
        }
    }

    public List<Edge> GetOutgoingEdges() {
        return graph.edges.FindAll(delegate(Edge e) {
            return e.Begin.Id == Id && e.End;
        });
    }

    public List<Edge> GetIncomingEdges() {
        return graph.edges.FindAll(delegate(Edge e) {
            return e.End.Id == Id && e.Begin;
        });
    }

    void OnMouseOver() {
        if (Input.GetKey("left shift") && Input.GetMouseButtonDown(0) && !graph.Locked) {
            drawEdgeToggle = true;
            dragEdge = Instantiate(graph.prefabEdge, Vector3.zero, Quaternion.identity);
            dragEdge.Begin = this; 
            Vector3 start = transform.position;
            start.z = 1;
            Vector3 target = Camera.main.ScreenToWorldPoint(Input.mousePosition);
            target.z = 1;
            dragEdge.BeginPosition = start;
            dragEdge.EndPosition = target;
        } else if (Input.GetMouseButtonDown(0)) {
            moveToggle = true;
        } else if (Input.GetMouseButtonUp(0)) {
            moveToggle = false;
        } else if (Input.GetMouseButtonDown(1)) {
            // do nothing
        } else if (Input.GetMouseButtonUp(1) && !graph.Locked) {
            graph.RemoveNode(this);
        } else if (Input.GetKeyDown("s") && !graph.Locked) {
            graph.SourceNode = (graph.SourceNode != this ? this : null);
        } else if (Input.GetKeyDown("t") && !graph.Locked) {
            graph.TargetNode = (graph.TargetNode != this ? this : null);
        }
    }

    void DragNode() {
        Vector3 target = Camera.main.ScreenToWorldPoint(Input.mousePosition);
        target.x = Mathf.Clamp(target.x, Camera.main.transform.position.x - (Camera.main.aspect) * Camera.main.orthographicSize, Camera.main.transform.position.x + (Camera.main.aspect) * Camera.main.orthographicSize);
        target.y = Mathf.Clamp(target.y, Camera.main.transform.position.y - Camera.main.orthographicSize, Camera.main.transform.position.y + Camera.main.orthographicSize);
        target.z = transform.position.z;
        transform.position = Vector3.MoveTowards(transform.position, target, 1.5f);
        graph.UpdateEdgePositions(this);
    }

    void Update() {
        if (moveToggle) { DragNode(); }
        if (drawEdgeToggle) { PreviewEdge(); }
    }
}