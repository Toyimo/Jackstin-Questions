#include <iostream>

using namespace std;

/*最小堆*/
class Heap{
public:
    static void min(int* arr, int length, int root){
        if(root >= length) return;
        int largest = root;
        int left = 2 * root + 1;
        int right = 2 * root + 2;
        if(left < length && arr[left] > arr[largest]) largest = left;
        if(right < length && arr[right] > arr[largest]) largest = right;
        if(largest != root){
            swap(arr[largest], arr[root]);
            min(arr, length, largest);
        }
        
    }
    static void build(int* arr, int length){
        for(int i = (length - 1) /2; i >= 0; i--){
            min(arr, length, i);
        }
    }
};

/*堆排序*/
void heap_sort(int* arr, int length){
    Heap::build(arr, length);
    for(int i = length - 1; i >= 1; i--){
        swap(arr[0], arr[i]);
        Heap::min(arr, i , 0);
    }
}


/*归并*/
class Merge{
public:
    static void sort(int*arr, int n){
        aux = new int[n]();
        sub(arr, 0, n - 1);
    }
private:
    static void merge(int* arr, int lo, int mid, int hi){
        int i = lo, j = mid + 1;
        for(int k = lo; k <= hi; k++){
            aux[k] = arr[k];
        }
        for(int k = lo; k <= hi; k++){
            if(i > mid)              arr[k] = aux[j++];
            else if(j > hi)          arr[k] = aux[i++];
            else if(aux[j] < aux[i]) arr[k] = aux[j++];
            else                     arr[k] = aux[i++];
        }
    }
    static void sub(int* arr, int lo, int hi){
        if(lo >= hi) return;
        int mid = lo + (hi - lo) / 2;
        sub(arr, lo, mid);
        sub(arr, mid + 1, hi);
        merge(arr, lo, mid, hi);
    }
public:
    static int* aux;
};
int* Merge::aux = nullptr;


/*快排*/
class Quick{
private:
    static int partition(int* arr, int lo, int hi){
        int i = lo, j = hi + 1;
        int v = arr[lo];
        while(1){
            while(arr[++i] < v) if(i == hi) break;
            while(v < arr[--j]) if(j == lo) break;
            if(i >= j) break;
            swap(arr[i], arr[j]);
        }
        swap(arr[lo], arr[j]);
        return j;
    }
    static void quick(int* arr, int lo, int hi){
        if(lo >= hi) return;
        int pivot = partition(arr, lo, hi);
        quick(arr, lo, pivot - 1);
        quick(arr, pivot + 1, hi);
    }
public:
    static void sort(int* arr, int n){
        quick(arr, 0, n - 1);
    }
};


/*冒泡*/
void bubble_sort(int* arr, int n){
    for(int i = 0; i < n; i++){
        for(int j = n - 1; j > i; j--){
            if(arr[j] < arr[j - 1]) swap(arr[j], arr[j - 1]);
        }
    }
}

/*选择*/
void select_sort(int* arr, int n){
    for(int i = 0; i < n - 1; i++){
        int min = i;
        for(int j = i + 1; j < n; j++){
            if(arr[j] < arr[min]) min = j;
        }
        swap(arr[i], arr[min]);
    }
}

/*插入*/
void insert_sort(int* arr, int n){
    for(int i = 0; i < n - 1; i++){
        for(int j = i + 1; j > 0; j--){
            if(arr[j] < arr[j - 1]) swap(arr[j], arr[j - 1]);
        }
    }
}

int main() {
    int n = 7;
    int* arr = new int[7]{4, 1, 6, 5, 2, 3, 8};
    //insert_sort(arr, n);
    //select_sort(arr, n);
    //bubble_sort(arr, n);
    //heap_sort(arr, n);
    //Quick::sort(arr, n);
    //Merge::sort(arr,n);
    for(int i = 0; i < n; i++){
        cout << arr[i] << ",";
    }
    cout << endl;
    return 0;
}